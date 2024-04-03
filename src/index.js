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
import onChange  from 'on-change';

// Custom error codes with stack support.
import Err from './error.js';

// Native imports
import { existsSync, readFileSync, mkdirSync } from 'fs';
import { resolve, sep } from 'path';

// Package.json
const pkgdata = JSON.parse(readFileSync('./package.json', 'utf8'));

import Database from 'better-sqlite3/lib/database';

const NAME_REGEX = /^([\w-]+)$/;

/**
 * A simple, synchronous, fast key/value storage build around better-sqlite3.
 * Contains extra utility methods for managing arrays and objects.
 * @class Enmap
 */
class Enmap {
  #name;
  #db;
  #inMemory;
  #autoEnsure;
  #ensureProps;
  #serializer;
  #deserializer;
  #changedCB;

    /**
   * Initializes a new Enmap, with options.
   * @param {Object} [options] Options for the enmap. See https://enmap.evie.codes/usage#enmap-options for details.

   * @param {string} [options.name] The name of the enmap. Represents its table name in sqlite. Unless inMemory is set to true, the enmap will be persisted to disk.

   * @param {string} [options.dataDir] Defaults to `./data`. Determines where the sqlite files will be stored. Can be relative
   * (to your project root) or absolute on the disk. Windows users , remember to escape your backslashes!
   * *Note*: Enmap will not automatically create the folder if it is set manually, so make sure it exists before starting your code!
   
   * @param {boolean} [options.ensureProps] defaults to `true`. If enabled and the value in the enmap is an object, using ensure() will also ensure that
   * every property present in the default object will be added to the value, if it's absent. See ensure API reference for more information.
   
   * @param {*} [options.autoEnsure] default is disabled. When provided a value, essentially runs ensure(key, autoEnsure) automatically so you don't have to.
   * This is especially useful on get(), but will also apply on set(), and any array and object methods that interact with the database.
   
   * @param {Function} [options.serializer] Optional. If a function is provided, it will execute on the data when it is written to the database.
   * This is generally used to convert the value into a format that can be saved in the database, such as converting a complete class instance to just its ID.
   * This function may return the value to be saved, or a promise that resolves to that value (in other words, can be an async function).
   
   * @param {Function} [options.deserializer] Optional. If a function is provided, it will execute on the data when it is read from the database.
   * This is generally used to convert the value from a stored ID into a more complex object.
   * This function may return a value, or a promise that resolves to that value (in other words, can be an async function).
   * 
   * @param {boolean} [options.inMemory] Optional. If set to true, the enmap will be in-memory only, and will not write to disk. Useful for temporary stores.
   * 
   * @param {Object} [options.sqliteOptions] Optional. An object of options to pass to the better-sqlite3 Database constructor.
   *
   * @example
   * const Enmap = require("enmap");

   * // Named, Persistent enmap
   * const myEnmap = new Enmap({ name: "testing" });
   * 
   * // Memory-only enmap
   * const memoryEnmap = new Enmap({ inMemory: true });
   *
   * // Enmap that automatically assigns a default object when getting or setting anything.
   * const autoEnmap = new Enmap({name: "settings", autoEnsure: { setting1: false, message: "default message"}})
   */
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
      this.#db = new Database(`${dataDir}${sep}enmap.sqlite`, options.sqliteOptions);
    }

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

    process.on('exit', () => {
      this.#db.close();
    });
  }
  
  /**
   * Sets a value in Enmap. If the key already has a value, overwrites the data (or the value in a path, if provided).
   * @param {string} key Required. The location in which the data should be saved.
   * @param {*} value Required. The value to write.
   * Values must be serializable, which is done through (better-serialize)[https://github.com/RealShadowNova/better-serialize]
   * If the value is not directly serializable, please use a custom serializer/deserializer.
   * @param {string} path Optional. The path to the property to modify inside the value object or array.
   * Should be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @example
   * // Direct Value Examples
   * enmap.set('simplevalue', 'this is a string');
   * enmap.set('isEnmapGreat', true);
   * enmap.set('TheAnswer', 42);
   * enmap.set('IhazObjects', { color: 'black', action: 'paint', desire: true });
   * enmap.set('ArraysToo', [1, "two", "tree", "foor"])
   *
   * // Settings Properties
   * enmap.set('IhazObjects', 'blue', 'color'); //modified previous object
   * enmap.set('ArraysToo', 'three', 2); // changes "tree" to "three" in array.
   */
  set(key, value, path) {
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

  /**
   * Update an existing object value in Enmap by merging new keys. **This only works on objects**, any other value will throw an error.
   * Heavily inspired by setState from React's class components.
   * This is very useful if you have many different values to update and don't want to have more than one .set(key, value, prop) lines.
   * @param {string} key The key of the object to update.
   * @param {*} valueOrFunction Either an object to merge with the existing value, or a function that provides the existing object
   * and expects a new object as a return value. In the case of a straight value, the merge is recursive and will add any missing level.
   * If using a function, it is your responsibility to merge the objects together correctly.
   * @example
   * // Define an object we're going to update
   * enmap.set("obj", { a: 1, b: 2, c: 3 });
   *
   * // Direct merge
   * enmap.update("obj", { d: 4, e: 5 });
   * // obj is now { a: 1, b: 2, c: 3, d: 4, e: 5 }
   *
   * // Functional update
   * enmap.update("obj", (previous) => ({
   *   ...obj,
   *   f: 6,
   *   g: 7
   * }));
   * // this example takes heavy advantage of the spread operators.
   * // More info: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
   * @returns {*} The modified (merged) value.
   */
  update(key, valueOrFunction) {
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

  /**
   * Retrieves a value from the enmap, using its key.
   * @param {string} key The key to retrieve from the enmap.
   * @param {string} path Optional. The property to retrieve from the object or array.
   * Should be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @example
   * const myKeyValue = enmap.get("myKey");
   * console.log(myKeyValue);
   *
   * const someSubValue = enmap.get("anObjectKey", "someprop.someOtherSubProp");
   * @return {*} The parsed value for this key.
   */
  get(key, path) {
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

  /**
   * Returns an observable object. Modifying this object or any of its properties/indexes/children
   * will automatically save those changes into enmap. This only works on
   * objects and arrays, not "basic" values like strings or integers.
   * @param {*} key The key to retrieve from the enmap.
   * @param {string} path Optional. The property to retrieve from the object or array.
   * @return {*} The value for this key.
   */
  observe(key, path) {
    this.#check(key, ['Object', 'Array'], path);
    const data = this.get(key, path);
    const proxy = onChange(data, () => {
      this.set(key, proxy, path);
    });
    return proxy;
  }

  /**
   * Get the number of key/value pairs saved in the enmap.
   * @readonly
   * @returns {number} The number of elements in the enmap.
  */
  get length() {
    const data = this.#db
      .prepare(`SELECT count(*) FROM '${this.#name}';`)
      .get();
    return data['count(*)'];
  }

  /**
   * Get all the keys of the enmap as an array.
   * @readonly
   * @returns {Array<string>} An array of all the keys in the enmap.
  */
  get keys() {
    const stmt = this.#db.prepare(`SELECT key FROM ${this.#name}`);
    const indexes = [];
    for (const row of stmt.iterate()) {
      indexes.push(row.key);
    }
    return indexes;
  }

  /**
   * Get all the values of the enmap as an array.
   * @readonly
   * @returns {Array<*>} An array of all the values in the enmap.
  */
  get values() {
    const stmt = this.#db.prepare(`SELECT value FROM ${this.#name}`);
    const values = [];
    for (const row of stmt.iterate()) {
      values.push(this.#parse(row.value));
    }
    return values;
  }

  /**
   * Get all entries of the enmap as an array, with each item containing the key and value.
   * @readonly
   * @returns {Array<Array<*,*>>} An array of arrays, with each sub-array containing two items, the key and the value.
  */
  get entries() {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    const entries = [];
    for (const row of stmt.iterate()) {
      entries.push([row.key, this.#parse(row.value)]);
    }
    return entries;
  }

  /**
   * Get the better-sqlite3 database object. Useful if you want to directly query or interact with the
   * underlying SQLite database. Use at your own risk, as errors here might cause loss of data or corruption!
   * @return {Database}
   */
  get db() {
    return this.#db;
  }

  /**
   * Generates an automatic numerical key for inserting a new value.
   * This is a "weak" method, it ensures the value isn't duplicated, but does not
   * guarantee it's sequential (if a value is deleted, another can take its place).
   * Useful for logging, actions, items, etc - anything that doesn't already have a unique ID.
   * @readonly
   * @example
   * enmap.set(enmap.autonum, "This is a new value");
   * @return {number} The generated key number.
   */
  get autonum() {
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

    /**
   * Push to an array value in Enmap.
   * @param {string} key Required. The key of the array element to push to in Enmap.
   * @param {*} value Required. The value to push to the array.
   * @param {string} path Optional. The path to the property to modify inside the value object or array.
   * Should be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @param {boolean} allowDupes Optional. Allow duplicate values in the array (default: false).
   * @example
   * // Assuming
   * enmap.set("simpleArray", [1, 2, 3, 4]);
   * enmap.set("arrayInObject", {sub: [1, 2, 3, 4]});
   *
   * enmap.push("simpleArray", 5); // adds 5 at the end of the array
   * enmap.push("arrayInObject", "five", "sub"); // adds "five" at the end of the sub array
   */
    push(key, value, path, allowDupes = false) {
      this.#keycheck(key);
      this.#check(key, ['Array', 'Object']);
      const data = this.get(key, path);
      if (!isArray(data)) throw new Err('Key does not point to an array', 'EnmapPathError');
      if (!allowDupes && data.includes(value)) return;
      data.push(value);
      this.set(key, data);
    }

  // AWESOME MATHEMATICAL METHODS

  /**
   * Executes a mathematical operation on a value and saves it in the enmap.
   * @param {string} key The enmap key on which to execute the math operation.
   * @param {string} operation Which mathematical operation to execute. Supports most
   * math ops: =, -, *, /, %, ^, and english spelling of those operations.
   * @param {number} operand The right operand of the operation.
   * @param {string} path Optional. The property path to execute the operation on, if the value is an object or array.
   * @example
   * // Assuming
   * points.set("number", 42);
   * points.set("numberInObject", {sub: { anInt: 5 }});
   *
   * points.math("number", "/", 2); // 21
   * points.math("number", "add", 5); // 26
   * points.math("number", "modulo", 3); // 2
   * points.math("numberInObject", "+", 10, "sub.anInt");
   * @returns {number} The updated value after the operation
   */
  math(key, operation, operand) {
    this.#keycheck(key);
    this.#check(key, ['Number']);
    const data = this.get(key);
    const updatedValue = this.#math(data, operation, operand)
    this.set(key, updatedValue);
    return updatedValue;
  }


  /**
   * Increments a key's value or property by 1. Value must be a number, or a path to a number.
   * @param {string} key The enmap key where the value to increment is stored.
   * @param {string} path Optional. The property path to increment, if the value is an object or array.
   * @example
   * // Assuming
   * points.set("number", 42);
   * points.set("numberInObject", {sub: { anInt: 5 }});
   *
   * points.inc("number"); // 43
   * points.inc("numberInObject", "sub.anInt"); // {sub: { anInt: 6 }}
   * @returns {number} The udpated value after incrementing.
   */
  inc(key) {
    this.#keycheck(key);
    this.#check(key, ['Number']);
    const data = this.get(key);
    this.set(key, data + 1);
    return data + 1;
  }

  /**
   * Decrements a key's value or property by 1. Value must be a number, or a path to a number.
   * @param {string} key The enmap key where the value to decrement is stored.
   * @param {string} path Optional. The property path to decrement, if the value is an object or array.
   * @example
   * // Assuming
   * points.set("number", 42);
   * points.set("numberInObject", {sub: { anInt: 5 }});
   *
   * points.dec("number"); // 41
   * points.dec("numberInObject", "sub.anInt"); // {sub: { anInt: 4 }}
   * @returns {Enmap} The enmap.
   */
  dec(key) {
    this.#keycheck(key);
    const data = this.get(key);
    this.set(key, data - 1);
    return data - 1;
  }

  /**
   * Returns the key's value, or the default given, ensuring that the data is there.
   * This is a shortcut to "if enmap doesn't have key, set it, then get it" which is a very common pattern.
   * @param {string} key Required. The key you want to make sure exists.
   * @param {*} defaultValue Required. The value you want to save in the database and return as default.
   * @param {string} path Optional. If presents, ensures both the key exists as an object, and the full path exists.
   * Should be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @example
   * // Simply ensure the data exists (for using property methods):
   * enmap.ensure("mykey", {some: "value", here: "as an example"});
   * enmap.has("mykey"); // always returns true
   * enmap.get("mykey", "here") // returns "as an example";
   *
   * // Get the default value back in a variable:
   * const settings = mySettings.ensure("1234567890", defaultSettings);
   * console.log(settings) // enmap's value for "1234567890" if it exists, otherwise the defaultSettings value.
   * @return {*} The value from the database for the key, or the default value provided for a new key.
   */
  ensure(key, defaultValue, path) {
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

  /**
   * Returns whether or not the key exists in the Enmap.
   * @param {string} key Required. The key of the element to add to The Enmap or array.
   * @param {string} path Optional. The property to verify inside the value object or array.
   * Should be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @example
   * if(enmap.has("myKey")) {
   *   // key is there
   * }
   *
   * if(!enmap.has("myOtherKey", "oneProp.otherProp.SubProp")) return false;
   * @returns {boolean}
   */
  has(key) {
    this.#keycheck(key);
    const data = this.#db.prepare(`SELECT count(*) FROM ${this.#name} WHERE key = ?`).get(key);
    return data['count(*)'] > 0;
  }

  /**
   * Performs Array.includes() on a certain enmap value. Works similar to
   * [Array.includes()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes).
   * @param {string} key Required. The key of the array to check the value of.
   * @param {string|number} value Required. The value to check whether it's in the array.
   * @param {string} path Optional. The property to access the array inside the value object or array.
   * Should be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @return {boolean} Whether the array contains the value.
  */
  includes(key, value, path) {
    this.#keycheck(key);
    this.#check(key, ['Array'], path);
    const data = this.get(key, path);
    if (!isArray(data)) throw new Err('Key does not point to an array', 'EnmapPathError');
    return data.includes(value);
  }

  /**
   * Deletes a key in the Enmap.
   * @param {string} key Required. The key of the element to delete from The Enmap.
   * @param {string} path Optional. The name of the property to remove from the object.
   * Should be a path with dot notation, such as "prop1.subprop2.subprop3"
   */
  delete(key, path) {
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

  /**
   * Deletes everything from the enmap.
   * @returns {void}
   */
  clear () {
    this.#db.prepare(`DELETE FROM ${this.#name}`).run();
  }

  /**
   * Remove a value in an Array or Object element in Enmap. Note that this only works for
   * values, not keys. Note that only one value is removed, no more. Arrays of objects must use a function to remove,
   * as full object matching is not supported.
   * @param {string} key Required. The key of the element to remove from in Enmap.
   * @param {*|Function} val Required. The value to remove from the array or object. OR a function to match an object.
   * If using a function, the function provides the object value and must return a boolean that's true for the object you want to remove.
   * @param {string} path Optional. The name of the array property to remove from.
   * Should be a path with dot notation, such as "prop1.subprop2.subprop3".
   * If not presents, removes directly from the value.
   * @example
   * // Assuming
   * enmap.set('array', [1, 2, 3])
   * enmap.set('objectarray', [{ a: 1, b: 2, c: 3 }, { d: 4, e: 5, f: 6 }])
   *
   * enmap.remove('array', 1); // value is now [2, 3]
   * enmap.remove('objectarray', (value) => value.e === 5); // value is now [{ a: 1, b: 2, c: 3 }]
   */
  remove(key, val, path) {
    this.#keycheck(key);
    this.#check(key, ['Array', 'Object']);
    const data = this.get(key, path);
    const criteria = isFunction(val) ? val : (value) => val === value;
    const index = data.findIndex(criteria);
    if (index > -1) {
      data.splice(index, 1);
    }
    this.set(key, data, path);
  }

  /**
   * Exports the enmap data to stringified JSON format.
   * **__WARNING__**: Does not work on memory enmaps containing complex data!
   * @returns {string} The enmap data in a stringified JSON format.
   */
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

    /**
   * Import an existing json export from enmap. This data must have been exported from enmap,
   * and must be from a version that's equivalent or lower than where you're importing it.
   * (This means Enmap 5 data is compatible in Enmap 6).
   * @param {string} data The data to import to Enmap. Must contain all the required fields provided by an enmap export().
   * @param {boolean} overwrite Defaults to `true`. Whether to overwrite existing key/value data with incoming imported data
   * @param {boolean} clear Defaults to `false`. Whether to clear the enmap of all data before importing
   * (**__WARNING__**: Any existing data will be lost! This cannot be undone.)
   */
  import(data, overwrite = true, clear = false) {
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
      this.#set(key, this.#parse(value));
    }
  }

  /**
   * Initialize multiple Enmaps easily.
   * @param {Array<string>} names Array of strings. Each array entry will create a separate enmap with that name.
   * @param {Object} options Options object to pass to each enmap, excluding the name..
   * @example
   * // Using local variables.
   * const Enmap = require('enmap');
   * const { settings, tags, blacklist } = Enmap.multi(['settings', 'tags', 'blacklist']);
   *
   * // Attaching to an existing object (for instance some API's client)
   * const Enmap = require("enmap");
   * Object.assign(client, Enmap.multi(["settings", "tags", "blacklist"]));
   *
   * @returns {Object} An array of initialized Enmaps.
   */
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

  /**
   * Obtains random value(s) from this Enmap. This relies on {@link Enmap#array}.
   * @param {number} [count] Number of values to obtain randomly
   * @returns {*|Array<*>} The single value if `count` is undefined,
   * or an array of values of `count` length
   */
  random(count = 1) {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name} ORDER BY RANDOM() LIMIT ?`).bind(count);
    const results = [];
    for (const row of stmt.iterate()) {
      results.push([row.key, this.#parse(row.value)]);
    }
    return results;
  }

  /**
   * Obtains random key(s) from this Enmap. This relies on {@link Enmap#keyArray}
   * @param {number} [count] Number of keys to obtain randomly
   * @returns {*|Array<*>} The single key if `count` is undefined,
   * or an array of keys of `count` length
   */
  randomKey(count = 1) {
    const stmt = this.#db.prepare(`SELECT key FROM ${this.#name} ORDER BY RANDOM() LIMIT ?`).bind(count);
    const results = [];
    for (const row of stmt.iterate()) {
      results.push(row.key);
    }
    return results;
  }

  /**
   * Similar to
   * [Array.every()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every).
   * Supports either a predicate function or a value to compare.
   * Returns true only if the predicate function returns true for all elements in the array (or the value is strictly equal in all elements).
   * @param {Function | string} valueOrFunction Function used to test (should return a boolean), or a value to compare.
   * @param {string} [path] Required if the value is an object. The path to the property to compare with.
   * @returns {boolean}
   */
  every(valueOrFunction, path) {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate()) {
      const parsed = this.#parse(row.value);
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

  /**
   * Similar to
   * [Array.some()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some).
   * Supports either a predicate function or a value to compare.
   * Returns true if the predicate function returns true for at least one element in the array (or the value is equal in at least one element).
   * @param {Function | string} valueOrFunction Function used to test (should return a boolean), or a value to compare.
   * @param {string} [path] Required if the value is an object. The path to the property to compare with.
   * @returns {Array}
   */
  some(valueOrFunction, path) {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate()) {
      const parsed = this.#parse(row.value);
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

  /**
   * Similar to
   * [Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).
   * Returns an array of the results of applying the callback to all elements.
   * @param {Function | string} pathOrFn A function that produces an element of the new Array, or a path to the property to map.
   * @returns {Array}
   */
  map(pathOrFn) {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    const results = [];
    for (const row of stmt.iterate()) {
      const parsed = this.#parse(row.value);
      if (isFunction(pathOrFn)) {
        results.push(pathOrFn(parsed, row.key));
      } else {
        results.push(_get(parsed, pathOrFn));
      }
    }
    return results;
  }

  /**
   * Searches for a single item where its specified property's value is identical to the given value
   * (`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is similar to
   * [Array.find()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find).
   * @param {string|Function} pathOrFn The path to the value to test against, or the function to test with
   * @param {*} [value] The expected value - only applicable and required if using a property for the first argument
   * @returns {*}
   * @example
   * enmap.find('username', 'Bob');
   * @example
   * enmap.find(val => val.username === 'Bob');
   */
  find(pathOrFn, value) {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate()) {
      const parsed = this.#parse(row.value);
      const func = isFunction(pathOrFn)
        ? pathOrFn
        : (v) => value === _get(v, pathOrFn);
      if (func(parsed, row.key)) {
        return parsed;
      }
    }
    return null;
  }

  /**
   * Searches for the key of a single item where its specified property's value is identical to the given value
   * (`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is similar to
   * [Array.findIndex()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex).
   * @param {string|Function} pathOrFn The path to the value to test against, or the function to test with
   * @param {*} [value] The expected value - only applicable and required if using a property for the first argument
   * @returns {string|number}
   * @example
   * enmap.findIndex('username', 'Bob');
   * @example
   * enmap.findIndex(val => val.username === 'Bob');
  */
  findIndex(pathOrFn, value) {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    for (const row of stmt.iterate()) {
      const parsed = this.#parse(row.value);
      const func = isFunction(pathOrFn)
        ? pathOrFn
        : (v) => value === _get(v, pathOrFn);
      if (func(parsed, row.key)) {
        return row.key;
      }
    }
    return null;
  }

  /**
   * Similar to
   * [Array.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce).
   * @param {Function} predicate Function used to reduce, taking three arguments; `accumulator`, `currentValue`, `currentKey`.
   * @param {*} [initialValue] Starting value for the accumulator
   * @returns {*}
   */
  reduce(predicate, initialValue) {
    this.#db.aggregate('reduce', {
      start: initialValue,
      step: (accumulator, currentValue) => predicate(accumulator, this.#parse(currentValue)),
    });
    return this.#db.prepare(`SELECT reduce(value) FROM ${this.#name}`).pluck().get();
  }

  /**
   * Similar to
   * [Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).
   * Returns an array of values where the given function returns true for that value.
   * Alternatively you can provide a value and path to filter by using exact value matching.
   * @param {Function} pathOrFn  The path to the value to test against, or the function to test with.
   * If using a function, this function should return a boolean.
   * @param {string} [value] Value to use as `this` when executing function
   * @returns {Enmap}
   */
  filter(pathOrFn, value) {
    this.#db.aggregate('filter', {
      start: [],
      step: (accumulator, currentValue) => {
        const parsed = this.#parse(currentValue);
        if (isFunction(pathOrFn)) {
          if (pathOrFn(parsed)) {
            accumulator.push(parsed);
          }
        } else {
          if (!value) throw new Err('Value is required for non-function predicate', 'EnmapValueError');
          const pathValue = _get(parsed, pathOrFn);
          if (value === pathValue) {
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

  // TODO : change this function to the input parameters are pathOrFn and value, just like the find and findkey method elsewhere in this class.
  /**
   * Deletes entries that satisfy the provided filter function.
   * Alternatively you can provide a value and path to filter by using exact value matching.
   * @param {Function} valueOrFn Function used to test (should return a boolean)
   * @param {string} [path] Value to use as `this` when executing function
   * @returns {number} The number of removed entries
  */
  sweep(valueOrFn, path) {
    const stmt = this.#db.prepare(`SELECT key, value FROM ${this.#name}`);
    let count = 0;
    for (const row of stmt.iterate()) {
      const parsed = this.#parse(row.value);
      const data = isNil(path) ? parsed : _get(parsed, path);
      if (isFunction(valueOrFn)) {
        if (valueOrFn(data, row.key)) {
          count++;
          this.delete(row.key);
        }
      } else {
        if (valueOrFn === data) {
          count++;
          this.delete(row.key);
        }
      }
    }
    return count;
  }

  /**
   * Function called whenever data changes within Enmap after the initial load.
   * Can be used to detect if another part of your code changed a value in enmap and react on it.
   * @example
   * enmap.changed((keyName, oldValue, newValue) => {
   *   console.log(`Value of ${keyName} has changed from: \n${oldValue}\nto\n${newValue}`);
   * });
   * @param {Function} cb A callback function that will be called whenever data changes in the enmap.
   */
  changed(cb) {
    this.#changedCB = cb;
  }

  // TODO: RE-ADD forEach (ugh). (partition, merge?)

  // INTERNAL METHODS

  /*
   * Internal method used to insert or update a key in the database without circular calls to ensure() or others. 
   * @param {string} key Key to update in database
   * @param {*} value value to save in database
   * Path is not supported in this method as it writes the whole key.
   */
  #set(key, value) {
    let serialized;
    try {
      serialized = stringify(this.#serializer(value, key));
    } catch (e) {
      serialized = stringify(this.#serializer(onChange.target(value), key));
    }
    this.#db.prepare(`INSERT OR REPLACE INTO ${this.#name} (key, value) VALUES (?, ?)`).run(key, serialized);
  }

    /*
   * Internal Method. Parses JSON data.
   * Reserved for future use (logical checking)
   * @param {*} value The data to check/parse
   * @returns {*} An object or the original data.
   */
  #parse(value) {
    return this.#deserializer(parse(value));
  }

  /* INTERNAL METHOD */

  #keycheck(key, type = 'key') {
    if (!NAME_REGEX.test(key)) {
      throw new Error(`Invalid ${type} for enmap - only alphanumeric characters, underscores and hyphens are allowed.`);
    }
  }

    /*
   * INTERNAL method to verify the type of a key or property
   * Will THROW AN ERROR on wrong type, to simplify code.
   * @param {string} key Required. The key of the element to check
   * @param {string} type Required. The javascript constructor to check
   * @param {string} path Optional. The dotProp path to the property in the object enmap.
   */
    #check(key, type, path) {
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
}

export default Enmap;
