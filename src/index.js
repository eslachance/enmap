import { existsSync, readFileSync, mkdirSync } from 'fs';
import { resolve, sep } from 'path';

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
import Database from 'better-sqlite3/lib/database';
import onChange  from 'on-change';

import { stringify, parse } from 'better-serialize';
import Err from './error.js';
const pkgdata = JSON.parse(readFileSync('./package.json', 'utf8'));

const NAME_REGEX = /^([\w-]+)$/;

class Enmap {
  #name;
  #db;
  #inMemory;
  #autoEnsure;
  #ensureProps;
  #serializer;
  #deserializer;
  #changedCB

  constructor(options) {
    this.#inMemory = options.inMemory ?? false;
    if (options.name === '::memory::') {
      this.#inMemory = true;
      console.warn('Using ::memory:: as a name is deprecated and will be removed in the future. Use { inMemory: true } instead.')
    }
    this.#ensureProps = options.ensureProps ?? true;
    this.#serializer = options.serializer ? options.serializer : (data) => data;
    this.#deserializer = options.deserializer
    ? options.deserializer
    : (data) => data;
    this.#autoEnsure = options.autoEnsure;

    if (this.#inMemory) {
      this.#db = new Database(':memory:');
      this.#name = 'MemoryEnmap';
    } else {
      this.#name = options.name;
      if (!options.dataDir) {
        if (!existsSync('./data')) {
          mkdirSync('./data');
        }
      }
      const dataDir = resolve(process.cwd(), options.dataDir || 'data');
      this.#db = new Database(`${dataDir}${sep}enmap.sqlite`);
    }

    this.#init();
  }

  get(key, path = null) {
    this.#keycheck(key);

    if (!isNil(this.#autoEnsure) && !this.has(key)) {
      this.#set(key, this.#autoEnsure);
    }

    const data = this.#db.prepare(`SELECT value FROM ${this.#name}  WHERE key = ?`).get(key);
    const parsed = data ? this.#parse(data.value) : null;
    if (isNil(parsed)) return null;
    
    if (path) {
      this.#check(key, ['Object']);
      return _get(parsed, path);
    }
    return parsed;
  }

  ensure(key, defaultValue, path = null) {
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
      if (this.#ensureProps) this.ensure(key, {});
      if (this.has(key, path)) return this.get(key, path);
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

  random(count = 1) {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name} ORDER BY RANDOM() LIMIT ?`).bind(count);
    const results = [];
    for (const row of stmt.iterate()) {
      results.push([row.key, this.#parse(row.value)]);
    }
    return results;
  }

  randomKey(count = 1) {
    const stmt = this.#db.prepare(`SELECT key FROM ${this.#name} ORDER BY RANDOM() LIMIT ?`).bind(count);
    const results = [];
    for (const row of stmt.iterate()) {
      results.push(row.key);
    }
    return results;
  }

  observe(key, path = null) {
    this.#check(key, ['Object', 'Array'], path);
    const data = this.get(key, path);
    const proxy = onChange(data, () => {
      this.set(key, proxy, path);
    });
    return proxy;
  }

  has(key) {
    this.#keycheck(key);
    const data = this.#db.prepare(`SELECT count(*) FROM ${this.#name} WHERE key = ?`).get(key);
    return data['count(*)'] > 0;
  }

  set(key, value, path = null) {
    this.#keycheck(key);
    let data = this.get(key);
    const oldValue = cloneDeep(data);
    if (!isNil(path)) {
      if (isNil(data)) data = {};
      _set(data, path, value);
    } else {
      data = value;
    }
    if (isFunction(this.#changedCB)) this.#changedCB( key, oldValue, data);
    this.#set(key, data);
  }

  #set(key, value) {
    let serialized;
    try {
      serialized = stringify(this.#serializer(value, key));
    } catch (e) {
      serialized = stringify(this.#serializer(onChange.target(value), key));
    }
    this.#db.prepare(`INSERT OR REPLACE INTO ${this.#name} (key, value) VALUES (?, ?)`).run(key, serialized);
    return this;
  }

  #parse(value) {
    return this.#deserializer(parse(value));
  }

  inc(key) {
    this.#keycheck(key);
    this.#check(key, ['Number']);
    const data = this.get(key);
    this.set(key, data + 1);
  }

  dec(key) {
    this.#keycheck(key);
    const data = this.get(key);
    this.set(key, data - 1);
  }

  math(key, operation, operand) {
    this.#keycheck(key);
    this.#check(key, ['Number']);
    const data = this.get(key);
    this.set(key, this.#math(data, operation, operand));
  }

  delete(key, path = null) {
    this.#keycheck(key);
    if (path) {
      this.#check(key, ['Object']);
      const data = this.get(key);
      _set(data, path, undefined);
      this.set(key, data);
    } else {
      this.#db.prepare(`DELETE FROM ${this.#name} WHERE key = ?`).run(key);
    }
  }

  update(key, path, value) {
    this.#keycheck(key);
    this.#check(key, ['Object']);
    const data = this.get(key);
    _set(data, path, value);
    this.set(key, data);
  }

  /* ARRAY METHODS */

  push(key, value, path = null, allowDupes = false) {
    this.#keycheck(key);
    this.#check(key, ['Array', 'Object']);
    const data = this.get(key, path);
    if (!isArray(data)) throw new Err('Key does not point to an array', 'EnmapPathError');
    if (!allowDupes && data.includes(value)) return;
    data.push(value);
    this.set(key, data);
  }

  remove(key, val, path = null) {
    this.#keycheck(key);
    this.#check(key, ['Array', 'Object']);
    const data = this.get(key, path);
    const criteria = isFunction(val) ? val : (value) => val === value;
    const index = data.findIndex(criteria);
    if (index > -1) {
      data.splice(index, 1);
    }
    return this.set(key, data, path);
  }

  every(predicate, path) {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate()) {
      const parsed = this.#parse(row.value);
      const data = isNil(path) ? parsed : _get(parsed, path);
      if (isFunction(predicate)) {
        if (!predicate(data, row.key)) {
          return false;
        }
      } else {
        if (predicate !== data) {
          return false;
        }
      }
    }
    return true;
  }

  some(predicate, path) {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate()) {
      const parsed = this.#parse(row.value);
      const data = isNil(path) ? parsed : _get(parsed, path);
      if (isFunction(predicate)) {
        if (predicate(data, row.key)) {
          return true;
        }
      } else {
        if (predicate === data) {
          return true;
        }
      }
    }
    return false;
  }

  map(predicate) {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    const results = [];
    for (const row of stmt.iterate()) {
      const parsed = this.#parse(row.value);
      if (isFunction(predicate)) {
        results.push(predicate(parsed, row.key));
      } else {
        results.push(_get(parsed, predicate));
      }
    }
    return results;
  }

  find(predicate, path) {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate()) {
      const parsed = this.#parse(row.value);
      const data = isNil(path) ? parsed : _get(parsed, path);
      if (isFunction(predicate)) {
        if (predicate(data, row.key)) {
          return parsed;
        }
      } else {
        if (predicate === data) {
          return parsed;
        }
      }
    }
    return null;
  }

  findKey(predicate, path) {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate()) {
      const parsed = this.#parse(row.value);
      const data = isNil(path) ? parsed : _get(parsed, path);
      if (isFunction(predicate)) {
        if (predicate(data, row.key)) {
          return row.key;
        }
      } else {
        if (predicate === data) {
          return row.key;
        }
      }
    }
    return null;
  }

  // does not work with path
  reduce(predicate, initialValue) {
    this.#db.aggregate('reduce', {
      start: initialValue,
      step: (accumulator, currentValue) => predicate(accumulator, this.#parse(currentValue)),
    });
    return this.#db.prepare(`SELECT reduce(value) FROM ${this.#name}`).pluck().get();
  }

  // TODO : Document that predicate and path have swapped!
  filter(predicate, path) {
    this.#db.aggregate('filter', {
      start: [],
      step: (accumulator, currentValue) => {
        const parsed = this.#parse(currentValue);
        if (isFunction(predicate)) {
          if (predicate(parsed)) {
            accumulator.push(parsed);
          }
        } else {
          if (!path) throw new Err('Path is required for non-function predicate', 'EnmapPathError');
          const value = _get(parsed, path);
          if (predicate === value) {
            accumulator.push(parsed);
          }
        }
        return accumulator;
      },
      result: (accumulator) => JSON.stringify(accumulator),
    });
    const results = this.#db.prepare(`SELECT filter(value) FROM ${this.#name}`).pluck().get();
    return JSON.parse(results);
  }

  sweep(predicate, path) {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate()) {
      const parsed = this.#parse(row.value);
      const data = isNil(path) ? parsed : _get(parsed, path);
      if (isFunction(predicate)) {
        if (predicate(data, row.key)) {
          this.delete(row.key);
        }
      } else {
        if (predicate === data) {
          this.delete(row.key);
        }
      }
    }
  }

  includes(key, value, path = null) {
    this.#keycheck(key);
    this.#check(key, ['Array'], path);
    const data = this.get(key, path);
    if (!isArray(data)) throw new Err('Key does not point to an array', 'EnmapPathError');
    return data.includes(value);
  }

  get length() {
    const data = this.#db
      .prepare(`SELECT count(*) FROM '${this.#name}';`)
      .get();
    return data['count(*)'];
  }

  get keys() {
    const stmt = this.#db.prepare(`SELECT key FROM ${this.#name}`);
    const indexes = [];
    for (const row of stmt.iterate()) {
      indexes.push(row.key);
    }
    return indexes;
  }

  get values() {
    const stmt = this.#db.prepare(`SELECT value FROM ${this.#name}`);
    const values = [];
    for (const row of stmt.iterate()) {
      values.push(this.#parse(row.value));
    }
    return values;
  }

  get entries() {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    const entries = [];
    for (const row of stmt.iterate()) {
      entries.push([row.key, this.#parse(row.value)]);
    }
    return entries;
  }

  changed(cb) {
    this.#changedCB = cb;
  }

  autonum() {
    let { lastnum } = this.#db
      .prepare("SELECT lastnum FROM 'internal::autonum' WHERE enmap = ?")
      .get(this.#name);
    lastnum++;
    this.#db
      .prepare(
        "INSERT OR REPLACE INTO 'internal::autonum' (enmap, lastnum) VALUES (?, ?)",
      )
      .run(this.#name, lastnum);
    return lastnum.toString();
  }

  get db() {
    return this.#db;
  }

  clear () {
    this.#db.prepare(`DELETE FROM ${this.#name}`).run();
  }

  export() {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    const entries = [];
    for (const row of stmt.iterate()) {
      entries.push(row);
    }
    return stringify({
      name: this.#name,
      exportDate: Date.now(),
      version: pkgdata.version,
      keys: entries,
    })
  }

  import(data, overwrite = true, clear = false) {
    if (typeof data === 'string') {
      data = parse(data);
    }
    if (data.name !== this.#name) {
      throw new Err('Data is not for this enmap', 'EnmapDataError');
    }
    if (isNil(data))
    throw new Err(
      `No data provided for import() in "${this.#name}"`,
      'EnmapImportError',
    );

    const majorVersion = parseInt(pkgdata.version.split('.')[0]);
    if (majorVersion < 6) {
      throw new Err('Importing data from enmap v5 or lower is not supported', 'EnmapDataError');
    }

    if (clear) this.deleteAll();
    for (const entry of data.keys) {
      const { key, value } = entry;
      if (!overwrite && this.has(key)) continue;
      this.#set(key, this.#parse(value));
    }
  }

  /* INTERNAL METHOD */

  #keycheck(key, type = 'key') {
    if (!NAME_REGEX.test(key)) {
      throw new Error(`Invalid ${type} for enmap - only alphanumeric characters, underscores and hyphens are allowed.`);
    }
  }

  #init() {
    if (!this.#db) {
      throw new Err('Database Could Not Be Opened', 'EnmapDBConnectionError');
    }

    // Check if enmap by this name is in the sqlite master table
    const table = this.#db
    .prepare(
      "SELECT count(*) FROM sqlite_master WHERE type='table' AND name = ?;",
    )
    .get(this.#name);

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
  }

    /*
   * INTERNAL method to verify the type of a key or property
   * Will THROW AN ERROR on wrong type, to simplify code.
   * @param {string} key Required. The key of the element to check
   * @param {string} type Required. The javascript constructor to check
   * @param {string} path Optional. The dotProp path to the property in the object enmap.
   */
    #check(key, type, path = null) {
      key = key.toString();
      if (!this.has(key))
        throw new Err(
          `The key "${key}" does not exist in the enmap "${this.#name}"`,
          'EnmapPathError',
        );
      if (!type) return;
      if (!isArray(type)) type = [type];
      if (!isNil(path)) {
        this.#check(key, 'Object');
        const data = this.get(key);
        if (isNil(_get(data, path))) {
          throw new Err(
            `The property "${path}" in key "${key}" does not exist. Please set() it or ensure() it."`,
            'EnmapPathError',
          );
        }
        if (!type.includes(_get(data, path).constructor.name)) {
          throw new Err(
            `The property "${path}" in key "${key}" is not of type "${type.join(
              '" or "',
            )}" in the enmap "${this.#name}" 
  (key was of type "${_get(data, path).constructor.name}")`,
            'EnmapTypeError',
          );
        }
      } else if (!type.includes(this.get(key).constructor.name)) {
        throw new Err(
          `The value for key "${key}" is not of type "${type.join(
            '" or "',
          )}" in the enmap "${this.#name}" (value was of type "${
            this.get(key).constructor.name
          }")`,
          'EnmapTypeError',
        );
      }
    }

  /*
   * INTERNAL method to execute a mathematical operation. Cuz... javascript.
   * And I didn't want to import mathjs!
   * @param {number} base the lefthand operand.
   * @param {string} op the operation.
   * @param {number} opand the righthand operand.
   * @return {number} the result.
   */
  #math(base, op, opand) {
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


  static multi(names, options) {
    if (!names.length || names.length < 1) {
      throw new Err(
        '"names" argument must be an array of string names.',
        'EnmapTypeError',
      );
    }
    const enmaps = {};
    for (const name of names) {
      enmaps[name] = new Enmap({ ...options, name });
    }
    return enmaps;
  }
}

export default Enmap;
