import {
  get as _get,
  set as _set,
  isNil,
  isFunction,
  isArray,
  isObject,
  cloneDeep,
  merge,
} from 'lodash-es';
import { stringify, parse } from 'better-serialize';
import onChange from 'on-change';

// Custom error codes with stack support.
import Err from './error.js';

// Native imports
import { existsSync, readFileSync, mkdirSync } from 'fs';
import { resolve, sep } from 'path';

// Package.json
const pkgdata = JSON.parse(readFileSync('./package.json', 'utf8'));

import Database from 'better-sqlite3';

const NAME_REGEX = /^([\w-]+)$/;

// Type definitions
export interface EnmapOptions<V = unknown, SV = unknown> {
  name?: string;
  dataDir?: string;
  ensureProps?: boolean;
  autoEnsure?: V;
  serializer?: (value: V, key: string) => SV;
  deserializer?: (value: SV, key: string) => V;
  inMemory?: boolean;
  sqliteOptions?: Database.Options;
}

type MathOps =
  | 'add'
  | 'addition'
  | '+'
  | 'sub'
  | 'subtract'
  | '-'
  | 'mult'
  | 'multiply'
  | '*'
  | 'div'
  | 'divide'
  | '/'
  | 'exp'
  | 'exponent'
  | '^'
  | 'mod'
  | 'modulo'
  | '%'
  | 'rand'
  | 'random';

// Path type helpers for nested object access
type Path<T, Key extends keyof T = keyof T> = Key extends string
  ? T[Key] extends Record<string, any>
    ?
        | `${Key}.${Path<T[Key], Exclude<keyof T[Key], keyof any[]>> &
            string}`
        | `${Key}.${Exclude<keyof T[Key], keyof any[]> & string}`
        | Key
    : Key
  : never;

/**
 * A simple, synchronous, fast key/value storage build around better-sqlite3.
 * Contains extra utility methods for managing arrays and objects.
 */
export default class Enmap<V = any, SV = unknown> {
  #name: string;
  #db: Database.Database;
  #inMemory: boolean;
  #autoEnsure?: V;
  #ensureProps: boolean;
  #serializer: (value: V, key: string) => SV;
  #deserializer: (value: SV, key: string) => V;
  #changedCB?: (key: string, oldValue: V | undefined, newValue: V | undefined) => void;

  constructor(options: EnmapOptions<V, SV>) {
    this.#inMemory = options.inMemory ?? false;
    if (options.name === '::memory::') {
      this.#inMemory = true;
      console.warn(
        'Using ::memory:: as a name is deprecated and will be removed in the future. Use { inMemory: true } instead.',
      );
    }
    this.#ensureProps = options.ensureProps ?? true;
    this.#serializer = options.serializer ? options.serializer : (data: V, key: string) => data as unknown as SV;
    this.#deserializer = options.deserializer
      ? options.deserializer
      : (data: SV) => data as unknown as V;
    this.#autoEnsure = options.autoEnsure;

    if (this.#inMemory) {
      this.#db = new Database(':memory:');
      this.#name = 'MemoryEnmap';
    } else {
      this.#name = options.name || 'defaultEnmap';
      if (!options.dataDir) {
        if (!existsSync('./data')) {
          mkdirSync('./data');
        }
      }
      const dataDir = resolve(process.cwd(), options.dataDir || 'data');
      this.#db = new Database(
        `${dataDir}${sep}enmap.sqlite`,
        options.sqliteOptions,
      );
    }

    if (!this.#db) {
      throw new Err('Database Could Not Be Opened', 'EnmapDBConnectionError');
    }

    // Check if enmap by this name is in the sqlite master table
    const table = this.#db
      .prepare(
        "SELECT count(*) FROM sqlite_master WHERE type='table' AND name = ?;",
      )
      .get(this.#name) as { 'count(*)': number };

    // This is a first init, create everything!
    if (!table['count(*)']) {
      // Create base table
      this.#db
        .prepare(
          `CREATE TABLE ${this.#name} (key text PRIMARY KEY, value text)`,
        )
        .run();

      // Define table properties : sync and write-ahead-log
      this.#db.pragma('synchronous = 1');
      this.#db.pragma('journal_mode = wal');

      // Create autonum table
      this.#db
        .prepare(
          `CREATE TABLE IF NOT EXISTS 'internal::autonum' (enmap TEXT PRIMARY KEY, lastnum INTEGER)`,
        )
        .run();
    }

    process.on('exit', () => {
      this.#db.close();
    });
  }

  set(key: string, value: any, path?: Path<V>): this {
    this.#keycheck(key);
    let data = this.get(key);
    const oldValue = cloneDeep(data);
    if (!isNil(path)) {
      if (isNil(data)) data = {} as V;
      _set(data as object, path, value);
    } else {
      data = value;
    }
    if (isFunction(this.#changedCB)) this.#changedCB(key, oldValue, data);
    this.#set(key, data);
    return this;
  }

  get(key: string, path?: Path<V>): any {
    this.#keycheck(key);

    if (!isNil(this.#autoEnsure) && !this.has(key)) {
      this.#set(key, this.#autoEnsure);
    }

    const data = this.#db
      .prepare(`SELECT value FROM ${this.#name}  WHERE key = ?`)
      .get(key) as { value: string } | undefined;
    const parsed = data ? this.#parse(data.value, key) : null;
    if (isNil(parsed)) return null;

    if (path) {
      this.#check(key, ['Object']);
      return _get(parsed, path);
    }
    return parsed;
  }

  has(key: string): boolean {
    this.#keycheck(key);
    const data = this.#db
      .prepare(`SELECT count(*) FROM ${this.#name} WHERE key = ?`)
      .get(key) as { 'count(*)': number };
    return data['count(*)'] > 0;
  }

  delete(key: string, path?: Path<V>): this {
    this.#keycheck(key);
    if (path) {
      this.#check(key, ['Object']);
      const data = this.get(key);
      if (data && typeof data === 'object') {
        _set(data, path, undefined);
        this.set(key, data);
      }
    } else {
      this.#db.prepare(`DELETE FROM ${this.#name} WHERE key = ?`).run(key);
    }
    return this;
  }

  clear(): void {
    this.#db.prepare(`DELETE FROM ${this.#name}`).run();
  }

  // Getters with proper typing
  get size(): number {
    const data = this.#db
      .prepare(`SELECT count(*) FROM '${this.#name}';`)
      .get() as { 'count(*)': number };
    return data['count(*)'];
  }

  get count(): number {
    return this.size;
  }

  get length(): number {
    return this.size;
  }

  get db(): Database.Database {
    return this.#db;
  }

  get autonum(): string {
    let result = this.#db
      .prepare("SELECT lastnum FROM 'internal::autonum' WHERE enmap = ?")
      .get(this.#name) as { lastnum: number } | undefined;

    let lastnum = result ? parseInt(result.lastnum.toString(), 10) : 0;

    lastnum++;
    this.#db
      .prepare(
        "INSERT OR REPLACE INTO 'internal::autonum' (enmap, lastnum) VALUES (?, ?)",
      )
      .run(this.#name, lastnum);
    return lastnum.toString();
  }

  // Array methods
  keys(): string[] {
    const stmt = this.#db.prepare(`SELECT key FROM ${this.#name}`);
    const indexes: string[] = [];
    for (const row of stmt.iterate() as IterableIterator<{ key: string }>) {
      indexes.push(row.key);
    }
    return indexes;
  }

  indexes(): string[] {
    return this.keys();
  }

  values(): V[] {
    const stmt = this.#db.prepare(`SELECT value FROM ${this.#name}`);
    const values: V[] = [];
    for (const row of stmt.iterate() as IterableIterator<{ value: string }>) {
      values.push(this.#parse(row.value));
    }
    return values;
  }

  entries(): [string, V][] {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    const entries: [string, V][] = [];
    for (const row of stmt.iterate() as IterableIterator<{ key: string; value: string }>) {
      entries.push([row.key, this.#parse(row.value, row.key)]);
    }
    return entries;
  }

  update(key: string, valueOrFunction: Partial<V> | ((data: V) => V)): V {
    this.#keycheck(key);
    this.#check(key, ['Object']);
    const data = this.get(key) as V;
    const fn = isFunction(valueOrFunction)
      ? valueOrFunction as (data: V) => V
      : (currentData: V) => merge(currentData, valueOrFunction);
    const merged = fn(data);
    this.#set(key, merged);
    return merged;
  }

  observe(key: string, path?: Path<V>): any {
    this.#check(key, ['Object', 'Array'], path);
    const data = this.get(key, path);
    const proxy = onChange(data as Record<string, unknown>, () => {
      this.set(key, proxy, path);
    });
    return proxy;
  }

  push(key: string, value: V, path?: Path<V>, allowDupes = false): this {
    this.#keycheck(key);
    this.#check(key, ['Array', 'Object']);
    const data = this.get(key, path);
    if (!isArray(data))
      throw new Err('Key does not point to an array', 'EnmapPathError');
    if (!allowDupes && data.includes(value)) return this;
    data.push(value);
    this.set(key, data as V, path);
    return this;
  }

  math(key: string, operation: MathOps, operand: number, path?: Path<V>): number | null {
    this.#keycheck(key);
    this.#check(key, ['Number'], path);
    const data = this.get(key, path);
    if (typeof data !== 'number') {
      throw new Err(`Value at key "${key}" is not a number`, 'EnmapTypeError');
    }
    const updatedValue = this.#math(data, operation, operand);
    this.set(key, updatedValue as V, path);
    return updatedValue;
  }

  inc(key: string, path?: Path<V>): this {
    this.#keycheck(key);
    this.#check(key, ['Number'], path);
    const data = this.get(key, path) as number;
    this.set(key, (data + 1) as V, path);
    return this;
  }

  dec(key: string, path?: Path<V>): this {
    this.#keycheck(key);
    this.#check(key, ['Number'], path);
    const data = this.get(key, path) as number;
    this.set(key, (data - 1) as V, path);
    return this;
  }

  ensure(key: string, defaultValue: any, path?: Path<V>): any {
    this.#keycheck(key);

    if (!isNil(this.#autoEnsure)) {
      if (!isNil(defaultValue))
        process.emitWarning(
          `Saving "${key}" autoEnsure value was provided for this enmap but a default value has also been provided. The defaultValue will be ignored, autoEnsure value is used instead.`,
        );
      defaultValue = this.#autoEnsure;
    }

    const clonedDefault = cloneDeep(defaultValue);

    if (!isNil(path)) {
      if (this.has(key) && this.get(key, path) !== undefined) return this.get(key, path);
      if (this.#ensureProps) this.ensure(key, {});

      this.set(key, clonedDefault, path);
      return clonedDefault;
    }

    if (this.#ensureProps && isObject(this.get(key))) {
      if (!isObject(clonedDefault))
        throw new Err(
          `Default value for "${key}" in enmap "${
            this.#name
          }" must be an object when merging with an object value.`,
          'EnmapArgumentError',
        );
      const merged = merge(clonedDefault, this.get(key));
      this.set(key, merged);
      return merged;
    }

    if (this.has(key)) return this.get(key);
    this.set(key, clonedDefault);
    return clonedDefault;
  }

  includes(key: string, value: V, path?: Path<V>): boolean {
    this.#keycheck(key);
    this.#check(key, ['Array'], path);
    const data = this.get(key, path) as V[] | undefined;
    return data?.includes(value) || false;
  }

  remove(key: string, val: V | ((value: V) => boolean), path?: Path<V>): this {
    this.#keycheck(key);
    this.#check(key, ['Array', 'Object']);
    const data = this.get(key, path) as V[];
    const criteria = isFunction(val) ? val as (value: V) => boolean : (value: V) => val === value;
    const index = data?.findIndex(criteria) ?? -1;
    if (index > -1) {
      data.splice(index, 1);
    }
    this.set(key, data as V, path);
    return this;
  }

  export(): string {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    const entries: { key: string; value: string }[] = [];
    for (const row of stmt.iterate() as IterableIterator<{ key: string; value: string }>) {
      entries.push(row);
    }
    return stringify({
      name: this.#name,
      exportDate: Date.now(),
      version: (pkgdata as { version: string }).version,
      keys: entries,
    });
  }

  import(data: string, overwrite = true, clear = false): this {
    let parsedData: { keys: { key: string; value: string }[] };
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      throw new Err('Data provided is not valid JSON', 'EnmapDataError');
    }

    if (isNil(parsedData))
      throw new Err(
        `No data provided for import() in "${this.#name}"`,
        'EnmapImportError',
      );

    if (clear) this.clear();
    for (const entry of parsedData.keys) {
      const { key, value } = entry;
      if (!overwrite && this.has(key)) continue;
      this.#db
        .prepare(
          `INSERT OR REPLACE INTO ${this.#name} (key, value) VALUES (?, ?)`,
        )
        .run(key, value);
    }
    return this;
  }

  static multi<V = unknown, SV = unknown>(
    names: string[],
    options?: Omit<EnmapOptions<V, SV>, 'name'>
  ): Record<string, Enmap<V, SV>> {
    if (!names.length) {
      throw new Err(
        '"names" argument must be an array of string names.',
        'EnmapTypeError',
      );
    }
    const enmaps: Record<string, Enmap<V, SV>> = {};
    for (const name of names) {
      enmaps[name] = new Enmap({ ...options, name });
    }
    return enmaps;
  }

  random(count = 1): [string, V][] {
    const stmt = this.#db
      .prepare(`SELECT key, value FROM ${this.#name} ORDER BY RANDOM() LIMIT ?`)
      .bind(count);
    const results: [string, V][] = [];
    for (const row of stmt.iterate() as IterableIterator<{ key: string; value: string }>) {
      results.push([row.key, this.#parse(row.value, row.key)]);
    }
    return results;
  }

  randomKey(count = 1): string[] {
    const stmt = this.#db
      .prepare(`SELECT key FROM ${this.#name} ORDER BY RANDOM() LIMIT ?`)
      .bind(count);
    const results: string[] = [];
    for (const row of stmt.iterate() as IterableIterator<{ key: string }>) {
      results.push(row.key);
    }
    return results;
  }

  every(valueOrFunction: ((val: V, key: string) => boolean) | any, path?: Path<V>): boolean {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate() as IterableIterator<{ key: string; value: string }>) {
      const parsed = this.#parse(row.value, row.key);
      const data = isNil(path) ? parsed : _get(parsed, path);
      if (isFunction(valueOrFunction)) {
        if (!valueOrFunction(parsed, row.key)) {
          return false;
        }
      } else {
        if (valueOrFunction !== data) {
          return false;
        }
      }
    }
    return true;
  }

  some(valueOrFunction: ((val: V, key: string) => boolean) | any, path?: Path<V>): boolean {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate() as IterableIterator<{ key: string; value: string }>) {
      const parsed = this.#parse(row.value, row.key);
      const data = isNil(path) ? parsed : _get(parsed, path);
      if (isFunction(valueOrFunction)) {
        if (valueOrFunction(parsed, row.key)) {
          return true;
        }
      } else {
        if (valueOrFunction === data) {
          return true;
        }
      }
    }
    return false;
  }

  map<R>(pathOrFn: ((val: V, key: string) => R) | string): R[] {
    const results: R[] = [];
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate() as IterableIterator<{ key: string; value: string }>) {
      const parsed = this.#parse(row.value, row.key);
      if (isFunction(pathOrFn)) {
        results.push((pathOrFn as (val: V, key: string) => R)(parsed, row.key));
      } else {
        results.push(_get(parsed, pathOrFn as string));
      }
    }
    return results;
  }

  find(pathOrFn: ((val: V, key: string) => boolean) | string, value?: any): V | null {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate() as IterableIterator<{ key: string; value: string }>) {
      const parsed = this.#parse(row.value, row.key);
      const func = isFunction(pathOrFn)
        ? pathOrFn as (val: V, key: string) => boolean
        : (v: V) => value === _get(v, pathOrFn);
      if (func(parsed, row.key)) {
        return parsed;
      }
    }
    return null;
  }

  findIndex(pathOrFn: ((val: V, key: string) => boolean) | string, value?: any): string | null {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate() as IterableIterator<{ key: string; value: string }>) {
      const parsed = this.#parse(row.value, row.key);
      const func = isFunction(pathOrFn)
        ? pathOrFn as (val: V, key: string) => boolean
        : (v: V) => value === _get(v, pathOrFn);
      if (func(parsed, row.key)) {
        return row.key;
      }
    }
    return null;
  }

  reduce<R>(predicate: (accumulator: R, val: V, key: string) => R, initialValue: R): R {
    let accumulator = initialValue;
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate() as IterableIterator<{ key: string; value: string }>) {
      const parsed = this.#parse(row.value, row.key);
      accumulator = predicate(accumulator, parsed, row.key);
    }
    return accumulator;
  }

  filter(pathOrFn: ((val: V, key: string) => boolean) | string, value?: any): V[] {
    const results: V[] = [];
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate() as IterableIterator<{ key: string; value: string }>) {
      const parsed = this.#parse(row.value, row.key);
      if (isFunction(pathOrFn)) {
        if ((pathOrFn as (val: V, key: string) => boolean)(parsed, row.key)) {
          results.push(parsed);
        }
      } else {
        if (!value)
          throw new Err(
            'Value is required for non-function predicate',
            'EnmapValueError',
          );
        const pathValue = _get(parsed, pathOrFn as string);
        if (value === pathValue) {
          results.push(parsed);
        }
      }
    }
    return results;
  }

  sweep(pathOrFn: ((val: V, key: string) => boolean) | string, value?: any): number {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    const deleteStmt = this.#db.prepare(
      `DELETE FROM ${this.#name} WHERE key = ?`,
    );
    const deleteKeys: string[] = [];
    const deleteMany = this.#db.transaction((keys: string[]) => {
      for (const key of keys) deleteStmt.run(key);
    });
    let count = 0;
    for (const row of stmt.iterate() as IterableIterator<{ key: string; value: string }>) {
      const parsed = this.#parse(row.value, row.key);
      if (isFunction(pathOrFn)) {
        if ((pathOrFn as (val: V, key: string) => boolean)(parsed, row.key)) {
          count++;
          deleteKeys.push(row.key);
        }
      } else {
        const data = _get(parsed, pathOrFn as string);
        if (value === data) {
          count++;
          deleteKeys.push(row.key);
        }
      }
    }
    deleteMany(deleteKeys);
    return count;
  }

  changed(cb: (key: string, oldValue: V | undefined, newValue: V | undefined) => void): void {
    this.#changedCB = cb;
  }

  partition(pathOrFn: ((val: V, key: string) => boolean) | string, value?: any): [V[], V[]] {
    const results: [V[], V[]] = [[], []];
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate() as IterableIterator<{ key: string; value: string }>) {
      const parsed = this.#parse(row.value, row.key);
      if (isFunction(pathOrFn)) {
        if ((pathOrFn as (val: V, key: string) => boolean)(parsed, row.key)) {
          results[0].push(parsed);
        } else {
          results[1].push(parsed);
        }
      } else {
        const data = _get(parsed, pathOrFn as string);
        if (value === data) {
          results[0].push(parsed);
        } else {
          results[1].push(parsed);
        }
      }
    }
    return results;
  }

  // MARK: Internal Methods
  #set(key: string, value: V): void {
    let serialized: string;
    try {
      serialized = stringify(this.#serializer(value, key));
    } catch (e) {
      // If serialization fails, try to get the underlying value from onChange proxy
      const targetValue = onChange.target && typeof onChange.target === 'function' 
        ? onChange.target(value as Record<string, unknown>) as V
        : value;
      serialized = stringify(this.#serializer(targetValue, key));
    }
    this.#db
      .prepare(
        `INSERT OR REPLACE INTO ${this.#name} (key, value) VALUES (?, ?)`,
      )
      .run(key, serialized);
  }

  #parse(value: string, key?: string): V {
    let parsed: SV;
    try {
      parsed = parse(value) as SV;
      try {
        return this.#deserializer(parsed, key || '');
      } catch (e: unknown) {
        throw new Err(
          'Error while deserializing data: ' + (e as Error).message,
          'EnmapParseError',
        );
      }
    } catch (e: unknown) {
      throw new Err(
        'Error while deserializing data: ' + (e as Error).message,
        'EnmapParseError',
      );
    }
  }

  #keycheck(key: string, type = 'key'): void {
    if (typeof key !== 'string') {
      throw new Error(
        `Invalid ${type} for enmap - keys must be a string.`,
      );
    }
  }

  #check(key: string, type: string | string[], path?: Path<V>): void {
    const keyStr = key.toString();
    if (!this.has(key))
      throw new Err(
        `The key "${keyStr}" does not exist in the enmap "${this.#name}"`,
        'EnmapPathError',
      );
    if (!type) return;
    const types = isArray(type) ? type : [type];
    if (!isNil(path)) {
      this.#check(key, 'Object');
      const data = this.get(key);
      const pathValue = _get(data, path);
      if (isNil(pathValue)) {
        throw new Err(
          `The property "${path}" in key "${keyStr}" does not exist. Please set() it or ensure() it."`,
          'EnmapPathError',
        );
      }
      const constructorName = pathValue?.constructor?.name || 'Unknown';
      if (!types.includes(constructorName)) {
        throw new Err(
          `The property "${path}" in key "${keyStr}" is not of type "${types.join(
            '" or "',
          )}" in the enmap "${this.#name}" 
(key was of type "${constructorName}")`,
          'EnmapTypeError',
        );
      }
    } else {
      const value = this.get(key);
      if (value !== null && value !== undefined) {
        const constructorName = value?.constructor?.name || 'Unknown';
        if (!types.includes(constructorName)) {
          throw new Err(
            `The value for key "${keyStr}" is not of type "${types.join(
              '" or "',
            )}" in the enmap "${this.#name}" (value was of type "${
              constructorName
            }")`,
            'EnmapTypeError',
          );
        }
      }
    }
  }

  #math(base: number, op: MathOps, opand: number): number | null {
    if (base == undefined || op == undefined || opand == undefined)
      throw new Err(
        'Math Operation requires base and operation',
        'EnmapTypeError',
      );
    switch (op) {
      case 'add':
      case 'addition':
      case '+':
        return base + opand;
      case 'sub':
      case 'subtract':
      case '-':
        return base - opand;
      case 'mult':
      case 'multiply':
      case '*':
        return base * opand;
      case 'div':
      case 'divide':
      case '/':
        return base / opand;
      case 'exp':
      case 'exponent':
      case '^':
        return Math.pow(base, opand);
      case 'mod':
      case 'modulo':
      case '%':
        return base % opand;
      case 'rand':
      case 'random':
        return Math.floor(Math.random() * Math.floor(opand));
    }
    return null;
  }
}