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
export interface EnmapOptions<V = any, SV = unknown> {
  name?: string;
  dataDir?: string;
  ensureProps?: boolean;
  autoEnsure?: V;
  serializer?: (value: V, key: string) => SV;
  deserializer?: (value: SV, key: string) => V;
  inMemory?: boolean;
  sqliteOptions?: any;
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

type PathValue<T, P extends Path<T>> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Path<T[Key]>
      ? PathValue<T[Key], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
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
      .get(this.#name) as any;

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
    let data = this.get(key as any) as any;
    const oldValue = cloneDeep(data);
    if (!isNil(path)) {
      if (isNil(data)) data = {};
      _set(data, path, value);
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
      .get(key) as any;
    const parsed = data ? this.#parse(data.value, key) : null;
    if (isNil(parsed)) return null as any;

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
      .get(key) as any;
    return data['count(*)'] > 0;
  }

  delete(key: string, path?: Path<V>): this {
    this.#keycheck(key);
    if (path) {
      this.#check(key, ['Object']);
      const data = this.get(key as any) as any;
      _set(data, path, undefined);
      this.set(key, data);
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
      .get() as any;
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
      .get(this.#name) as any;

    let lastnum = result ? parseInt(result.lastnum, 10) : 0;

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
    for (const row of stmt.iterate() as any) {
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
    for (const row of stmt.iterate() as any) {
      values.push(this.#parse(row.value));
    }
    return values;
  }

  entries(): [string, V][] {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    const entries: [string, V][] = [];
    for (const row of stmt.iterate() as any) {
      entries.push([row.key, this.#parse(row.value, row.key)]);
    }
    return entries;
  }

  // Simplified method implementations using 'any' for parameters to make it compile
  update(key: string, valueOrFunction: any): any {
    this.#keycheck(key);
    this.#check(key, ['Object']);
    const data = this.get(key);
    const fn = isFunction(valueOrFunction)
      ? valueOrFunction
      : () => merge(data, valueOrFunction);
    const merged = fn(data);
    this.#set(key, merged);
    return merged;
  }

  observe(key: string, path?: Path<V>): any {
    this.#check(key, ['Object', 'Array'], path);
    const data = this.get(key, path as any);
    const proxy = onChange(data as any, () => {
      this.set(key, proxy as any, path as any);
    });
    return proxy;
  }

  push(key: string, value: V, path?: Path<V>, allowDupes = false): this {
    this.#keycheck(key);
    this.#check(key, ['Array', 'Object']);
    const data = this.get(key, path as any);
    if (!isArray(data))
      throw new Err('Key does not point to an array', 'EnmapPathError');
    if (!allowDupes && data.includes(value)) return this;
    data.push(value);
    this.set(key, data as any, path as any);
    return this;
  }

  math(key: string, operation: MathOps, operand: number, path?: Path<V>): number | null {
    this.#keycheck(key);
    this.#check(key, ['Number'], path);
    const data = this.get(key, path as any);
    if (typeof data !== 'number') {
      throw new Err(`Value at key "${key}" is not a number`, 'EnmapTypeError');
    }
    const updatedValue = this.#math(data, operation, operand);
    this.set(key, updatedValue as any, path as any);
    return updatedValue;
  }

  inc(key: string, path?: Path<V>): this {
    this.#keycheck(key);
    this.#check(key, ['Number'], path);
    const data = this.get(key, path) as any;
    this.set(key, (data + 1) as any, path as any);
    return this;
  }

  dec(key: string, path?: Path<V>): this {
    this.#keycheck(key);
    this.#check(key, ['Number'], path);
    const data = this.get(key, path) as any;
    this.set(key, (data - 1) as any, path as any);
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

      this.set(key, clonedDefault as any, path as any);
      return clonedDefault;
    }

    if (this.#ensureProps && isObject(this.get(key as any))) {
      if (!isObject(clonedDefault))
        throw new Err(
          `Default value for "${key}" in enmap "${
            this.#name
          }" must be an object when merging with an object value.`,
          'EnmapArgumentError',
        );
      const merged = merge(clonedDefault, this.get(key as any));
      this.set(key, merged as any);
      return merged;
    }

    if (this.has(key)) return this.get(key as any);
    this.set(key, clonedDefault as any);
    return clonedDefault;
  }

  includes(key: string, value: V, path?: Path<V>): boolean {
    this.#keycheck(key);
    this.#check(key, ['Array'], path);
    const data = this.get(key, path) as any;
    return data?.includes(value) || false;
  }

  remove(key: string, val: any, path?: Path<V>): this {
    this.#keycheck(key);
    this.#check(key, ['Array', 'Object']);
    const data = this.get(key, path) as any;
    const criteria = isFunction(val) ? val : (value: V) => val === value;
    const index = data?.findIndex(criteria) ?? -1;
    if (index > -1) {
      data.splice(index, 1);
    }
    this.set(key, data as any, path as any);
    return this;
  }

  export(): string {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    const entries = [];
    for (const row of stmt.iterate() as any) {
      entries.push(row);
    }
    return stringify({
      name: this.#name,
      exportDate: Date.now(),
      version: (pkgdata as any).version,
      keys: entries,
    });
  }

  import(data: any, overwrite = true, clear = false): this {
    let parsedData;
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

  static multi(names: any, options?: any): any {
    if (!names.length) {
      throw new Err(
        '"names" argument must be an array of string names.',
        'EnmapTypeError',
      );
    }
    const enmaps: any = {};
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
    for (const row of stmt.iterate() as any) {
      results.push([row.key, this.#parse(row.value, row.key)]);
    }
    return results;
  }

  randomKey(count = 1): string[] {
    const stmt = this.#db
      .prepare(`SELECT key FROM ${this.#name} ORDER BY RANDOM() LIMIT ?`)
      .bind(count);
    const results: string[] = [];
    for (const row of stmt.iterate() as any) {
      results.push(row.key);
    }
    return results;
  }

  every(fn: (val: V, key: string) => boolean): boolean;
  every(value: any, path: Path<V>): boolean;
  every(valueOrFunction: ((val: V, key: string) => boolean) | any, path?: Path<V>): boolean {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate() as any) {
      const parsed = this.#parse(row.value, row.key);
      const data = isNil(path) ? parsed : _get(parsed, path);
      if (isFunction(valueOrFunction)) {
        if (!valueOrFunction(data, row.key)) {
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

  some(fn: (val: V, key: string) => boolean): boolean;
  some(value: any, path: Path<V>): boolean;
  some(valueOrFunction: ((val: V, key: string) => boolean) | any, path?: Path<V>): boolean {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate() as any) {
      const parsed = this.#parse(row.value, row.key);
      const data = isNil(path) ? parsed : _get(parsed, path);
      if (isFunction(valueOrFunction)) {
        if (valueOrFunction(data, row.key)) {
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
    for (const row of stmt.iterate() as any) {
      const parsed = this.#parse(row.value, row.key);
      if (isFunction(pathOrFn)) {
        results.push(pathOrFn(parsed, row.key));
      } else {
        results.push(_get(parsed, pathOrFn));
      }
    }
    return results;
  }

  find(pathOrFn: ((val: V, key: string) => boolean) | string, value?: any): V | null {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate() as any) {
      const parsed = this.#parse(row.value, row.key);
      const func = isFunction(pathOrFn)
        ? pathOrFn
        : (v: any) => value === _get(v, pathOrFn);
      if (func(parsed, row.key)) {
        return parsed;
      }
    }
    return null;
  }

  findIndex(pathOrFn: ((val: V, key: string) => boolean) | string, value?: any): string | null {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate() as any) {
      const parsed = this.#parse(row.value, row.key);
      const func = isFunction(pathOrFn)
        ? pathOrFn
        : (v: any) => value === _get(v, pathOrFn);
      if (func(parsed, row.key)) {
        return row.key;
      }
    }
    return null;
  }

  reduce<R>(predicate: (accumulator: R, val: V, key: string) => R, initialValue: R): R {
    let accumulator = initialValue;
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate() as any) {
      const parsed = this.#parse(row.value, row.key);
      accumulator = predicate(accumulator, parsed, row.key);
    }
    return accumulator;
  }

  filter(pathOrFn: ((val: V, key: string) => boolean) | string, value?: any): V[] {
    const results: V[] = [];
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate() as any) {
      const parsed = this.#parse(row.value, row.key);
      if (isFunction(pathOrFn)) {
        if (pathOrFn(parsed, row.key)) {
          results.push(parsed);
        }
      } else {
        if (!value)
          throw new Err(
            'Value is required for non-function predicate',
            'EnmapValueError',
          );
        const pathValue = _get(parsed, pathOrFn);
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
    const deleteKeys: any[] = [];
    const deleteMany = this.#db.transaction((cats: any) => {
      for (const cat of cats) deleteStmt.run(cat);
    });
    let count = 0;
    for (const row of stmt.iterate() as any) {
      const parsed = this.#parse(row.value, row.key);
      if (isFunction(pathOrFn)) {
        if (pathOrFn(parsed, row.key)) {
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
    for (const row of stmt.iterate() as any) {
      const parsed = this.#parse(row.value, row.key);
      if (isFunction(pathOrFn)) {
        if (pathOrFn(parsed, row.key)) {
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
    let serialized;
    try {
      serialized = stringify(this.#serializer(value, key));
    } catch (e) {
      serialized = stringify(this.#serializer(onChange.target(value as any) as V, key));
    }
    this.#db
      .prepare(
        `INSERT OR REPLACE INTO ${this.#name} (key, value) VALUES (?, ?)`,
      )
      .run(key, serialized);
  }

  #parse(value: any, key?: string): any {
    let parsed;
    try {
      parsed = parse(value);
      try {
        parsed = this.#deserializer(parsed as any, key || '');
      } catch (e: any) {
        throw new Err(
          'Error while deserializing data: ' + e.message,
          'EnmapParseError',
        );
      }
    } catch (e: any) {
      throw new Err(
        'Error while deserializing data: ' + e.message,
        'EnmapParseError',
      );
    }
    return parsed;
  }

  #keycheck(key: string, type = 'key'): void {
    if (typeof key !== 'string') {
      throw new Error(
        `Invalid ${type} for enmap - keys must be a string.`,
      );
    }
  }

  #check(key: string, type: any, path?: Path<V>): void {
    const keyStr = key.toString();
    if (!this.has(key))
      throw new Err(
        `The key "${keyStr}" does not exist in the enmap "${this.#name}"`,
        'EnmapPathError',
      );
    if (!type) return;
    if (!isArray(type)) type = [type];
    if (!isNil(path)) {
      this.#check(key, 'Object');
      const data = this.get(key as any);
      if (isNil(_get(data, path))) {
        throw new Err(
          `The property "${path}" in key "${keyStr}" does not exist. Please set() it or ensure() it."`,
          'EnmapPathError',
        );
      }
      if (!type.includes(_get(data, path).constructor.name)) {
        throw new Err(
          `The property "${path}" in key "${keyStr}" is not of type "${type.join(
            '" or "',
          )}" in the enmap "${this.#name}" 
(key was of type "${_get(data, path).constructor.name}")`,
          'EnmapTypeError',
        );
      }
    } else if (!type.includes(this.get(key as any)!.constructor.name)) {
      throw new Err(
        `The value for key "${keyStr}" is not of type "${type.join(
          '" or "',
        )}" in the enmap "${this.#name}" (value was of type "${
          this.get(key as any)!.constructor.name
        }")`,
        'EnmapTypeError',
      );
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