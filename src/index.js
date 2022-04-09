// Lodash should probably be a core lib but hey, it's useful!
const {
  get: _get,
  set: _set,
  has: _has,
  isNil,
  isFunction,
  isArray,
  isObject,
  toPath,
  merge,
  clone,
  cloneDeep,
} = require('lodash');
const serialize = require('serialize-javascript');
const onChange = require('on-change');

// Custom error codes with stack support.
const Err = require('./error.js');

// Native imports
const { resolve, sep } = require('path');
const fs = require('fs');

// Package.json
const pkgdata = require('../package.json');
const Database = require('better-sqlite3/lib/database');

const instances = [];

process.on('exit', () => {
  for (const instance of instances) instance.close();
});

/**
 * A enhanced Map structure with additional utility methods.
 * Can be made persistent
 * @extends {Map}
 */
class Enmap extends Map {
  #cloneLevel;
  #ensureProps;
  #serializer;
  #deserializer;
  #isDestroyed;
  #name;
  #off;
  #fetchAll;
  #autoFetch;
  #autoEnsure;
  #wal;
  #polling;
  #pollingInterval;
  #verbose;
  #db;
  #lastSync;
  /**
   * Initializes a new Enmap, with options.
   * @param {Iterable|string|void} iterable If iterable data, only valid in non-persistent enmaps.
   * If this parameter is a string, it is assumed to be the Enmap's name, which is a shorthand for adding a name in the options
   * and making the enmap persistent.
   * @param {Object} [options] Additional options for the enmap. See https://enmap.evie.codes/usage#enmap-options for details.
   * @param {string} [options.name] The name of the enmap. Represents its table name in sqlite. If present, the enmap is persistent.
   * If no name is given, the enmap is memory-only and is not saved in the database. As a shorthand, you may use a string for the name
   * instead of the options (see example).
   * @param {boolean} [options.fetchAll] Defaults to `true`. When enabled, will automatically fetch any key that's requested using get,
   * or other retrieval methods. This is a "synchronous" operation, which means it doesn't need any of this promise or callback use.
   * @param {string} [options.dataDir] Defaults to `./data`. Determines where the sqlite files will be stored. Can be relative
   * (to your project root) or absolute on the disk. Windows users , remember to escape your backslashes!
   * *Note*: Will not automatically create the folder if set manually, so make sure it exists.
   * @param {string} [options.cloneLevel] Defaults to deep. Determines how objects and arrays are treated when inserting and retrieving from the database.
   * See https://enmap.evie.codes/usage#enmap-options for more details on this option.
   * @param {boolean} [options.polling] defaults to `false`. Determines whether Enmap will attempt to retrieve changes from the database on a regular interval.
   * This means that if another Enmap in another process modifies a value, this change will be reflected in ALL enmaps using the polling feature.
   * @param {number} [options.pollingInterval] defaults to `1000`, polling every second. Delay in milliseconds to poll new data from the database.
   * The shorter the interval, the more CPU is used, so it's best not to lower this. Polling takes about 350-500ms if no data is found, and time will
   * grow with more changes fetched. In my tests, 15 rows took a little more than 1 second, every second.
   * @param {boolean} [options.ensureProps] defaults to `true`. If enabled and the value in the enmap is an object, using ensure() will also ensure that
   * every property present in the default object will be added to the value, if it's absent. See ensure API reference for more information.
   * @param {*} [options.autoEnsure] default is disabled. When provided a value, essentially runs ensure(key, autoEnsure) automatically so you don't have to.
   * This is especially useful on get(), but will also apply on set(), and any array and object methods that interact with the database.
   * @param {boolean} [options.autoFetch] defaults to `true`. When enabled, attempting to get() a key or do any operation on existing keys (such as array push, etc)
   * will automatically fetch the current key value from the database. Keys that are automatically fetched remain in memory and are not cleared.
   * @param {Function} [options.serializer] Optional. If a function is provided, it will execute on the data when it is written to the database.
   * This is generally used to convert the value into a format that can be saved in the database, such as converting a complete class instance to just its ID.
   * This function may return the value to be saved, or a promise that resolves to that value (in other words, can be an async function).
   * @param {Function} [options.deserializer] Optional. If a function is provided, it will execute on the data when it is read from the database.
   * This is generally used to convert the value from a stored ID into a more complex object.
   * This function may return a value, or a promise that resolves to that value (in other words, can be an async function).
   * @param {boolean} [options.wal=false] Check out Write-Ahead Logging: https://www.sqlite.org/wal.html
   * @param {Function} [options.verbose=(query) => null] A function to call with the direct SQL statement being ran by Enmap internally
   * @example
   * const Enmap = require("enmap");
   * // Non-persistent enmap:
   * const inMemory = new Enmap();
   *
   * // Named, Persistent enmap with string option
   * const myEnmap = new Enmap("testing");
   *
   * // Enmap that does not fetch everything, but does so on per-query basis:
   * const myEnmap = new Enmap({name: "testing", fetchAll: false});
   *
   * // Enmap that automatically assigns a default object when getting or setting anything.
   * const autoEnmap = new Enmap({name: "settings", autoEnsure: { setting1: false, message: "default message"}})
   */
  constructor(iterable, options = {}) {
    if (typeof iterable === 'string') {
      options.name = iterable;
      iterable = null;
    }
    if (!iterable || !(Symbol.iterator in iterable)) {
      //@ts-ignore
      options = iterable || options;
      iterable = null;
    }
    super();

    // Define local properties from the options.
    this.#off = Symbol('option_off');
    this.#name = options.name ?? '::memory::';
    this.#fetchAll = options.fetchAll ?? true;
    this.#autoFetch = options.autoFetch ?? true;
    this.#autoEnsure = options.autoEnsure ?? this.#off;
    this.#wal = options.wal ?? true;
    this.#polling = options.polling ?? false;
    this.#pollingInterval = options.pollingInterval ?? 1000;
    this.#ensureProps = options.ensureProps ?? true;
    this.#serializer = options.serializer ? options.serializer : (data) => data;
    this.#verbose = options.verbose ? options.verbose : () => null;
    this.#deserializer = options.deserializer
      ? options.deserializer
      : (data) => data;

    // CloneLevel is a little more involved... This'll be easier with TS :P
    this.#cloneLevel = options.cloneLevel ?? 'deep';
    if (!['none', 'shallow', 'deep'].includes(this.#cloneLevel)) {
      throw new Err(
        'Unknown Clone Level. Options are none, shallow, deep. Default is deep.',
        'EnmapOptionsError',
      );
    }

    if (this.#name !== '::memory::') {
      // Define the data directory where the enmap is stored.
      if (!options.dataDir) {
        if (!fs.existsSync('./data')) {
          fs.mkdirSync('./data');
        }
      }

      const dataDir = resolve(process.cwd(), options.dataDir || 'data');
      this.#db = new Database(`${dataDir}${sep}enmap.sqlite`, {
        verbose: this.#verbose,
      });
    } else {
      this.#db = new Database(':memory:', { verbose: this.#verbose });
      this.#name = 'MemoryEnmap';
    }
    
    if (this.#polling) {
      process.emitWarning(
        'Polling features will be removed in Enmap v6. If you need enmap in multiple processes, please consider moving to JOSH, https://josh.evie.dev/',
        );
      }
      
      // Initialize this property, to prepare for a possible destroy() call.
      // This is completely ignored in all situations except destroying the enmap.
    this.#validateName();
    this.#isDestroyed = false;
    this.#init(this.#db);
    instances.push(this);

    if (iterable) {
      for (const [key, value] of iterable) {
        this.#internalSet(key, value);
      }
    }
  }

  // Left for backwards compatibility
  get defer() {
    return Promise.resolve();
  }

  /**
   * Sets a value in Enmap.
   * @param {string} key Required. The key of the element to add to The Enmap.
   * @param {*} val Required. The value of the element to add to The Enmap.
   * If the Enmap is persistent this value MUST be stringifiable as JSON.
   * @param {string} path Optional. The path to the property to modify inside the value object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
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
   * @returns {Enmap} The enmap.
   */
  //@ts-ignore
  set(key, val, path = null) {
    if (isNil(key) || key.constructor.name !== 'String') {
      throw new Err(
        `Enmap requires keys to be a string. Provided: ${
          isNil(key) ? 'nil' : key.constructor.name
        }`,
        'EnmapKeyTypeError',
      );
    }
    key = key.toString();
    let data = this.get(key);
    const oldValue = super.has(key) ? this.#clone(data) : null;
    if (!isNil(path)) {
      if (isNil(data)) data = {};
      _set(data, path, val);
    } else {
      data = val;
    }
    if (isFunction(this.changedCB)) {
      this.changedCB(key, oldValue, data);
    }
    this.#internalSet(key, data, false);
    return super.set(key, this.#clone(data));
  }

  // eslint-disable-next-line valid-jsdoc
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
   */
  update(key, valueOrFunction) {
    this.#readyCheck();
    if (isNil(key)) {
      throw new Err('Key not provided for update function', 'EnmapKeyError');
    }
    this.#check(key, ['Object']);
    this.#fetchCheck(key);
    const previousValue = this.get(key);
    const fn = isFunction(valueOrFunction)
      ? valueOrFunction
      : () => merge(previousValue, valueOrFunction);
    const merged = fn(previousValue);
    this.#internalSet(key, merged);
    return merged;
  }

  /**
   * Retrieves a key from the enmap.
   * @param {string} key The key to retrieve from the enmap.
   * @param {string} path Optional. The property to retrieve from the object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @example
   * const myKeyValue = enmap.get("myKey");
   * console.log(myKeyValue);
   *
   * const someSubValue = enmap.get("anObjectKey", "someprop.someOtherSubProp");
   * @return {*} The value for this key.
   */
  get(key, path = null) {
    this.#readyCheck();
    if (isNil(key)) return null;
    this.#fetchCheck(key);
    key = key.toString();
    if (this.#autoEnsure !== this.#off && !this.has(key)) {
      this.#internalSet(key, this.#autoEnsure);
    }
    const data = super.get(key);
    if (!isNil(path)) {
      this.#check(key, ['Object', 'Array']);
      return _get(data, path);
    }
    return this.#clone(data);
  }

  /**
   * Returns an observable object. Modifying this object or any of its properties/indexes/children
   * will automatically save those changes into enmap. This only works on
   * objects and arrays, not "basic" values like strings or integers.
   * @param {*} key The key to retrieve from the enmap.
   * @param {string} path Optional. The property to retrieve from the object or array.
   * @return {*} The value for this key.
   */
  observe(key, path = null) {
    this.#check(key, ['Object', 'Array'], path);
    const data = this.get(key, path);
    const proxy = onChange(data, () => {
      this.set(key, proxy, path);
    });
    return proxy;
  }

  /**
   * Retrieves the number of rows in the database for this enmap, even if they aren't fetched.
   * @return {number} The number of rows in the database.
   */
  get count() {
    const data = this.#db
      .prepare(`SELECT count(*) FROM '${this.#name}';`)
      .get();
    return data['count(*)'];
  }

  /**
   * Retrieves all the indexes (keys) in the database for this enmap, even if they aren't fetched.
   * @return {Array<string>} Array of all indexes (keys) in the enmap, cached or not.
   */
  get indexes() {
    const rows = this.#db.prepare(`SELECT key FROM '${this.#name}';`).all();
    return rows.map((row) => row.key);
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
   * Fetches every key from the persistent enmap and loads them into the current enmap value.
   * @return {Enmap} The enmap containing all values.
   */
  fetchEverything() {
    this.#readyCheck();
    const rows = this.#db.prepare(`SELECT * FROM ${this.#name};`).all();
    for (const row of rows) {
      const val = this.#parseData(row.value, row.key);
      super.set(row.key, val);
    }
    return this;
  }

  /**
   * Force fetch one or more key values from the enmap. If the database has changed, that new value is used.
   * @param {string|number|Array<string|number>} keyOrKeys A single key or array of keys to force fetch from the enmap database.
   * @return {Enmap|*} The Enmap, including the new fetched values, or the value in case the function argument is a single key.
   */
  fetch(keyOrKeys) {
    this.#readyCheck();
    if (isArray(keyOrKeys)) {
      const data = this.#db
        .prepare(
          `SELECT * FROM ${this.#name} WHERE key IN (${'?, '
            .repeat(keyOrKeys.length)
            .slice(0, -2)})`,
        )
        .all(keyOrKeys);
      for (const row of data) {
        super.set(row.key, this.#parseData(row.value, row.key));
      }
      return this;
    } else {
      const data = this.#db
        .prepare(`SELECT * FROM ${this.#name} WHERE key = ?;`)
        .get(keyOrKeys);
      if (!data) return null;
      super.set(keyOrKeys, this.#parseData(data.value, keyOrKeys));
      return this.#parseData(data.value, keyOrKeys);
    }
  }

  /**
   * Removes a key or keys from the cache - useful when disabling autoFetch.
   * @param {string|number|Array<string|number>} keyOrArrayOfKeys A single key or array of keys to remove from the cache.
   * @returns {Enmap} The enmap minus the evicted keys.
   */
  evict(keyOrArrayOfKeys) {
    if (isArray(keyOrArrayOfKeys)) {
      keyOrArrayOfKeys.forEach((key) => super.delete(key));
    } else {
      super.delete(keyOrArrayOfKeys);
    }
    return this;
  }

  /**
   * Generates an automatic numerical key for inserting a new value.
   * This is a "weak" method, it ensures the value isn't duplicated, but does not
   * guarantee it's sequential (if a value is deleted, another can take its place).
   * Useful for logging, actions, items, etc - anything that doesn't already have a unique ID.
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
   * Function called whenever data changes within Enmap after the initial load.
   * Can be used to detect if another part of your code changed a value in enmap and react on it.
   * @example
   * enmap.changed((keyName, oldValue, newValue) => {
   *   console.log(`Value of ${keyName} has changed from: \n${oldValue}\nto\n${newValue}`);
   * });
   * @param {Function} cb A callback function that will be called whenever data changes in the enmap.
   */
  changed(cb) {
    this.changedCB = cb;
  }

  /**
   * Shuts down the database. USING THIS MAKES THE ENMAP UNUSABLE. You should
   * only use this method if you are closing your entire application.
   * This is already done by Enmap automatically on shutdown unless you disabled it.
   * @returns {Enmap} The enmap.
   */
  close() {
    this.#readyCheck();
    instances.splice(instances.indexOf(this), 1);
    this.#db.close();
    return this;
  }

  /**
   * Push to an array value in Enmap.
   * @param {string} key Required. The key of the array element to push to in Enmap.
   * This value MUST be a string or number.
   * @param {*} val Required. The value to push to the array.
   * @param {string} path Optional. The path to the property to modify inside the value object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @param {boolean} allowDupes Optional. Allow duplicate values in the array (default: false).
   * @example
   * // Assuming
   * enmap.set("simpleArray", [1, 2, 3, 4]);
   * enmap.set("arrayInObject", {sub: [1, 2, 3, 4]});
   *
   * enmap.push("simpleArray", 5); // adds 5 at the end of the array
   * enmap.push("arrayInObject", "five", "sub"); // adds "five" at the end of the sub array
   * @returns {Enmap} The enmap.
   */
  push(key, val, path = null, allowDupes = false) {
    const data = this.get(key);
    this.#check(key, 'Array', path);
    if (!isNil(path)) {
      const propValue = _get(data, path);
      if (!allowDupes && propValue.indexOf(val) > -1) return this;
      propValue.push(val);
      _set(data, path, propValue);
    } else {
      if (!allowDupes && data.indexOf(val) > -1) return this;
      data.push(val);
    }
    return this.#internalSet(key, data);
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
   *
   * @returns {Enmap} The enmap.
   */
  math(key, operation, operand, path = null) {
    this.#check(key, 'Number', path);
    const data = this.get(key, path);
    return this.set(key, this.#mathop(data, operation, operand), path);
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
   * @returns {Enmap} The enmap.
   */
  inc(key, path = null) {
    this.#check(key, 'Number', path);
    if (isNil(path)) {
      let val = this.get(key);
      return this.#internalSet(key, ++val);
    } else {
      const data = this.get(key);
      let propValue = _get(data, path);
      _set(data, path, ++propValue);
      return this.#internalSet(key, data);
    }
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
  dec(key, path = null) {
    this.#check(key, 'Number', path);
    if (isNil(path)) {
      let val = this.get(key);
      return this.#internalSet(key, --val);
    } else {
      const data = this.get(key);
      let propValue = _get(data, path);
      _set(data, path, --propValue);
      return this.#internalSet(key, data);
    }
  }

  /**
   * Returns the key's value, or the default given, ensuring that the data is there.
   * This is a shortcut to "if enmap doesn't have key, set it, then get it" which is a very common pattern.
   * @param {string} key Required. The key you want to make sure exists.
   * @param {*} defaultValue Required. The value you want to save in the database and return as default.
   * @param {string} path Optional. If presents, ensures both the key exists as an object, and the full path exists.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
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
  ensure(key, defaultValue, path = null) {
    this.#readyCheck();
    this.#fetchCheck(key);
    if (this.#autoEnsure !== this.#off) {
      // eslint-disable-next-line max-len
      if (!isNil(defaultValue))
        process.emitWarning(
          `Saving "${key}" autoEnsure value was provided for this enmap but a default value has also been provided. The defaultValue will be ignored, autoEnsure value is used instead.`,
        );
      defaultValue = this.#autoEnsure;
    }
    if (isNil(defaultValue))
      throw new Err(
        `No default value provided on ensure method for "${key}" in "${
          this.#name
        }"`,
        'EnmapArgumentError',
      );
    const clonedValue = this.#clone(defaultValue);
    if (!isNil(path)) {
      if (this.#ensureProps) this.ensure(key, {});
      if (this.has(key, path)) return this.get(key, path);
      this.set(key, defaultValue, path);
      return defaultValue;
    }
    if (this.#ensureProps && isObject(this.get(key))) {
      if (!isObject(clonedValue))
        throw new Err(
          `Default value for "${key}" in enmap "${
            this.#name
          }" must be an object when merging with an object value.`,
          'EnmapArgumentError',
        );
      const merged = merge(clonedValue, this.get(key));
      this.set(key, merged);
      return merged;
    }
    if (this.has(key)) return this.get(key);
    this.set(key, clonedValue);
    return clonedValue;
  }

  /* BOOLEAN METHODS THAT CHECKS FOR THINGS IN ENMAP */

  /**
   * Returns whether or not the key exists in the Enmap.
   * @param {string} key Required. The key of the element to add to The Enmap or array.
   * This value MUST be a string or number.
   * @param {string} path Optional. The property to verify inside the value object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @example
   * if(enmap.has("myKey")) {
   *   // key is there
   * }
   *
   * if(!enmap.has("myOtherKey", "oneProp.otherProp.SubProp")) return false;
   * @returns {boolean}
   */
  has(key, path = null) {
    this.#readyCheck();
    this.#fetchCheck(key);
    key = key.toString();
    if (!isNil(path)) {
      this.#check(key, 'Object');
      const data = this.get(key);
      return _has(data, path);
    }
    return super.has(key);
  }

  /**
   * Performs Array.includes() on a certain enmap value. Works similar to
   * [Array.includes()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes).
   * @param {string} key Required. The key of the array to check the value of.
   * @param {string|number} val Required. The value to check whether it's in the array.
   * @param {string} path Optional. The property to access the array inside the value object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @return {boolean} Whether the array contains the value.
   */
  includes(key, val, path = null) {
    this.#readyCheck();
    this.#fetchCheck(key);
    this.#check(key, ['Array', 'Object']);
    const data = this.get(key);
    if (!isNil(path)) {
      const propValue = _get(data, path);
      if (isArray(propValue)) {
        return propValue.includes(val);
      }
      throw new Err(
        `The property "${path}" in key "${key}" is not an Array in the enmap "${
          this.#name
        }" (property was of type "${propValue && propValue.constructor.name}")`,
        'EnmapTypeError',
      );
    } else if (isArray(data)) {
      return data.includes(val);
    }
    throw new Err(
      `The value of key "${key}" is not an Array in the enmap "${
        this.#name
      }" (value was of type "${data && data.constructor.name}")`,
      'EnmapTypeError',
    );
  }

  /**
   * Deletes a key in the Enmap.
   * @param {string} key Required. The key of the element to delete from The Enmap.
   * @param {string} path Optional. The name of the property to remove from the object.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @returns {Enmap} The enmap.
   */
  //@ts-ignore
  delete(key, path = null) {
    this.#readyCheck();
    this.#fetchCheck(key);
    key = key.toString();
    const oldValue = this.get(key);
    if (!isNil(path)) {
      let data = this.get(key);
      //@ts-ignore
      path = toPath(path);
      //@ts-ignore
      const last = path.pop();
      const propValue = path.length ? _get(data, path) : data;
      if (isArray(propValue)) {
        propValue.splice(last, 1);
      } else {
        delete propValue[last];
      }
      if (path.length) {
        _set(data, path, propValue);
      } else {
        data = propValue;
      }
      this.set(key, data);
    } else {
      super.delete(key);
      if (typeof this.changedCB === 'function') {
        this.changedCB(key, oldValue, null);
      }
      if (this.#polling) {
        this.#db
          .prepare(
            `INSERT INTO 'internal::changes::${
              this.#name
            }' (type, key, timestamp, pid) VALUES (?, ?, ?, ?);`,
          )
          .run('delete', key.toString(), Date.now(), process.pid);
      }
      this.#db.prepare(`DELETE FROM ${this.#name} WHERE key = ?`).run(key);
      return this;
    }
    return this;
  }

  /**
   * Deletes everything from the enmap. If persistent, clears the database of all its data for this table.
   */
  deleteAll() {
    this.#readyCheck();
    this.#db.prepare(`DELETE FROM ${this.#name};`).run();
    if (this.#polling) {
      this.#db
        .prepare(
          `INSERT INTO 'internal::changes::${
            this.#name
          }' (type, timestamp, pid) VALUES (?, ?, ?);`,
        )
        .run('clear', Date.now(), process.pid);
    }
    super.clear();
  }

  /**
   * Deletes everything from the enmap. If persistent, clears the database of all its data for this table.
   * @returns {void}
   */
  clear() {
    return this.deleteAll();
  }

  /**
   * Completely destroys the entire enmap. This deletes the database tables entirely.
   * It will not affect other enmap data in the same database, however.
   * THIS ACTION WILL DESTROY YOUR DATA AND CANNOT BE UNDONE.
   * @returns {null}
   */
  destroy() {
    this.deleteAll();

    this.#isDestroyed = true;

    const transaction = this.#db.transaction((run) => {
      for (const stmt of run) {
        this.#db.prepare(stmt).run();
      }
    });

    transaction([
      `DROP TABLE IF EXISTS ${this.#name};`,
      `DROP TABLE IF EXISTS 'internal::changes::${this.#name}';`,
      `DELETE FROM 'internal::autonum' WHERE enmap = '${this.#name}';`,
    ]);
    return null;
  }

  /**
   * Remove a value in an Array or Object element in Enmap. Note that this only works for
   * values, not keys. Note that only one value is removed, no more. Arrays of objects must use a function to remove,
   * as full object matching is not supported.
   * @param {string} key Required. The key of the element to remove from in Enmap.
   * This value MUST be a string or number.
   * @param {*|Function} val Required. The value to remove from the array or object. OR a function to match an object.
   * If using a function, the function provides the object value and must return a boolean that's true for the object you want to remove.
   * @param {string} path Optional. The name of the array property to remove from.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3".
   * If not presents, removes directly from the value.
   * @example
   * // Assuming
   * enmap.set('array', [1, 2, 3])
   * enmap.set('objectarray', [{ a: 1, b: 2, c: 3 }, { d: 4, e: 5, f: 6 }])
   *
   * enmap.remove('array', 1); // value is now [2, 3]
   * enmap.remove('objectarray', (value) => value.e === 5); // value is now [{ a: 1, b: 2, c: 3 }]
   * @returns {Enmap} The enmap.
   */
  remove(key, val, path = null) {
    this.#readyCheck();
    this.#fetchCheck(key);
    this.#check(key, ['Array', 'Object']);
    const data = this.get(key, path);
    const criteria = isFunction(val) ? val : (value) => val === value;
    const index = data.findIndex(criteria);
    if (index > -1) {
      data.splice(index, 1);
    }
    return this.set(key, data, path);
  }

  /**
   * Exports the enmap data to a JSON file.
   * **__WARNING__**: Does not work on memory enmaps containing complex data!
   * @returns {string} The enmap data in a stringified JSON format.
   */
  export() {
    this.#readyCheck();
    this.fetchEverything();
    return serialize(
      {
        name: this.#name,
        version: pkgdata.version,
        exportDate: Date.now(),
        keys: this.map((value, key) => ({ key, value })),
      },
      {
        space: 2,
      },
    );
  }

  /**
   * Import an existing json export from enmap from a string. This data must have been exported from enmap,
   * and must be from a version that's equivalent or lower than where you're importing it.
   * @param {string} data The data to import to Enmap. Must contain all the required fields provided by export()
   * @param {boolean} overwrite Defaults to `true`. Whether to overwrite existing key/value data with incoming imported data
   * @param {boolean} clear Defaults to `false`. Whether to clear the enmap of all data before importing
   * (**__WARNING__**: Any existing data will be lost! This cannot be undone.)
   * @returns {Enmap} The enmap with the new data.
   */
  import(data, overwrite = true, clear = false) {
    this.#readyCheck();
    if (clear) this.deleteAll();
    if (isNil(data))
      throw new Err(
        `No data provided for import() in "${this.#name}"`,
        'EnmapImportError',
      );
    try {
      const parsed = eval(`(${data})`);
      for (const thisEntry of parsed.keys) {
        const { key, value } = thisEntry;
        if (!overwrite && this.has(key)) continue;
        this.#internalSet(key, this.#deserializer(value, key));
      }
    } catch (err) {
      throw new Err(
        `Data provided for import() in "${
          this.#name
        }" is invalid JSON. Stacktrace:\n${err}`,
        'EnmapImportError',
      );
    }
    return this;
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
  static multi(names, options = {}) {
    if (!names.length || names.length < 1) {
      throw new Err(
        '"names" argument must be an array of string names.',
        'EnmapTypeError',
      );
    }

    const returnvalue = {};
    for (const name of names) {
      const enmap = new Enmap({ name, ...options });
      returnvalue[name] = enmap;
    }
    return returnvalue;
  }

  /* INTERNAL (Private) METHODS */

  /*
   * Internal Method. Initializes the enmap depending on given values.
   * @param {Map} database In order to set data to the Enmap, one must be provided.
   */
  #init(database) {
    this.#db = database;
    if (!this.#db) {
      throw new Err('Database Could Not Be Opened', 'EnmapDBConnectionError');
    }
    const table = this.#db
      .prepare(
        "SELECT count(*) FROM sqlite_master WHERE type='table' AND name = ?;",
      )
      .get(this.#name);
    if (!table['count(*)']) {
      this.#db
        .prepare(
          `CREATE TABLE ${this.#name} (key text PRIMARY KEY, value text)`,
        )
        .run();
      this.#db.pragma('synchronous = 1');
      if (this.#wal) this.#db.pragma('journal_mode = wal');
    }
    this.#db
      .prepare(
        `CREATE TABLE IF NOT EXISTS 'internal::changes::${
          this.#name
        }' (type TEXT, key TEXT, value TEXT, timestamp INTEGER, pid INTEGER);`,
      )
      .run();
    this.#db
      .prepare(
        `CREATE TABLE IF NOT EXISTS 'internal::autonum' (enmap TEXT PRIMARY KEY, lastnum INTEGER)`,
      )
      .run();
    if (this.#fetchAll) {
      this.fetchEverything();
    }
    // TEMPORARY MIGRATE CODE FOR AUTONUM
    // REMOVE FOR V6
    if (this.has('internal::autonum')) {
      this.#db
        .prepare(
          "INSERT OR REPLACE INTO 'internal::autonum' (enmap, lastnum) VALUES (?, ?)",
        )
        .run(this.#name, this.get('internal::autonum'));
      this.delete('internal::autonum');
    } else {
      const row = this.#db
        .prepare("SELECT lastnum FROM 'internal::autonum' WHERE enmap = ?")
        .get(this.#name);
      if (!row) {
        this.#db
          .prepare(
            "INSERT INTO 'internal::autonum' (enmap, lastnum) VALUES (?, ?)",
          )
          .run(this.#name, 0);
      }
    }

    if (this.#polling) {
      this.#lastSync = new Date();
      setInterval(() => {
        const changes = this.#db
          .prepare(
            `SELECT type, key, value FROM 'internal::changes::${
              this.#name
            }' WHERE timestamp >= ? AND pid <> ? ORDER BY timestamp ASC;`,
          )
          .all(this.#lastSync.getTime(), process.pid);
        for (const row of changes) {
          switch (row.type) {
            case 'insert':
              super.set(row.key, this.#parseData(row.value, row.key));
              break;
            case 'delete':
              super.delete(row.key);
              break;
            case 'clear':
              super.clear();
              break;
          }
        }
        this.#lastSync = new Date();
        this.#db
          .prepare(
            `DELETE FROM 'internal::changes::${
              this.#name
            }' WHERE ROWID IN (SELECT ROWID FROM 'internal::changes::${
              this.#name
            }' ORDER BY ROWID DESC LIMIT -1 OFFSET 100);`,
          )
          .run();
      }, this.#pollingInterval);
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
  #mathop(base, op, opand) {
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

  /**
   * Internal method used to validate persistent enmap names (valid Windows filenames)
   */
  #validateName() {
    this.#name = this.#name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  /*
   * Internal Method. Verifies if a key needs to be fetched from the database.
   * If persistent enmap and autoFetch is on, retrieves the key.
   * @param {string} key The key to check or fetch.
   */
  #fetchCheck(key, force = false) {
    key = key.toString();
    if (!['String', 'Number'].includes(key.constructor.name)) return;
    if (force) {
      this.fetch(key);
      return;
    }
    if (super.has(key)) return;
    if (!this.#autoFetch) return;
    this.fetch(key);
  }

  /*
   * Internal Method. Parses JSON data.
   * Reserved for future use (logical checking)
   * @param {*} data The data to check/parse
   * @returns {*} An object or the original data.
   */
  #parseData(data, key) {
    return this.#deserializer(eval(`(${data})`), key);
  }

  /*
   * Internal Method. Clones a value or object with the enmap's set clone level.
   * @param {*} data The data to clone.
   * @return {*} The cloned value.
   */
  #clone(data) {
    if (this.#cloneLevel === 'none') return data;
    if (this.#cloneLevel === 'shallow') return clone(data);
    if (this.#cloneLevel === 'deep') return cloneDeep(data);
    throw new Err(
      "Invalid cloneLevel. What did you *do*, this shouldn't happen!",
      'EnmapOptionsError',
    );
  }

  /*
   * Internal Method. Verifies that the database is ready, assuming persistence is used.
   */
  #readyCheck() {
    if (this.#isDestroyed)
      throw new Err(
        'This enmap has been destroyed and can no longer be used without being re-initialized.',
        'EnmapDestroyedError',
      );
  }

  /*
   * Internal Method. Sets data without looking at cache, fetching, or anything else. Used when fetch/ready checks are already made.
   */
  #internalSet(key, value, updateCache = true) {
    let serialized;
    try {
      serialized = serialize(this.#serializer(value, key));
    } catch (e) {
      serialized = serialize(this.#serializer(onChange.target(value), key));
    }
    this.#db
      .prepare(
        `INSERT OR REPLACE INTO ${this.#name} (key, value) VALUES (?, ?);`,
      )
      .run(key, serialized);
    if (this.#polling) {
      this.#db
        .prepare(
          `INSERT INTO 'internal::changes::${
            this.#name
          }' (type, key, value, timestamp, pid) VALUES (?, ?, ?, ?, ?);`,
        )
        .run('insert', key, serialized, Date.now(), process.pid);
    }
    if (updateCache) super.set(key, value);
    return this;
  }

  /*
  BELOW IS DISCORD.JS COLLECTION CODE
  Per notes in the LICENSE file, this project contains code from Amish Shah's Discord.js
  library. The code is from the Collections object, in discord.js version 11.

  All below code is sourced from Collections.
  https://github.com/discordjs/collection
  */

  /**
   * Creates an ordered array of the values of this Enmap.
   * The array will only be reconstructed if an item is added to or removed from the Enmap,
   * or if you change the length of the array itself. If you don't want this caching behaviour,
   * use `Array.from(enmap.values())` instead.
   * @returns {Array}
   */
  array() {
    return Array.from(this.values());
  }

  /**
   * Creates an ordered array of the keys of this Enmap
   * The array will only be reconstructed if an item is added to or removed from the Enmap,
   * or if you change the length of the array itself. If you don't want this caching behaviour,
   * use `Array.from(enmap.keys())` instead.
   * @returns {Array<string | number>}
   */
  keyArray() {
    return Array.from(this.keys());
  }

  /**
   * Obtains random value(s) from this Enmap. This relies on {@link Enmap#array}.
   * @param {number} [count] Number of values to obtain randomly
   * @returns {*|Array<*>} The single value if `count` is undefined,
   * or an array of values of `count` length
   */
  random(count) {
    let arr = this.array();
    if (count === undefined) return arr[Math.floor(Math.random() * arr.length)];
    if (typeof count !== 'number')
      throw new TypeError('The count must be a number.');
    if (!Number.isInteger(count) || count < 1)
      throw new RangeError('The count must be an integer greater than 0.');
    if (arr.length === 0) return [];
    const rand = new Array(count);
    arr = arr.slice();
    for (let i = 0; i < count; i++)
      rand[i] = arr.splice(Math.floor(Math.random() * arr.length), 1)[0];
    return rand;
  }

  /**
   * Obtains random key(s) from this Enmap. This relies on {@link Enmap#keyArray}
   * @param {number} [count] Number of keys to obtain randomly
   * @returns {*|Array<*>} The single key if `count` is undefined,
   * or an array of keys of `count` length
   */
  randomKey(count) {
    let arr = this.keyArray();
    if (count === undefined) return arr[Math.floor(Math.random() * arr.length)];
    if (typeof count !== 'number')
      throw new TypeError('The count must be a number.');
    if (!Number.isInteger(count) || count < 1)
      throw new RangeError('The count must be an integer greater than 0.');
    if (arr.length === 0) return [];
    const rand = new Array(count);
    arr = arr.slice();
    // eslint-disable-next-line
    for (let i = 0; i < count; i++)
      rand[i] = arr.splice(Math.floor(Math.random() * arr.length), 1)[0];
    return rand;
  }

  /**
   * Searches for all items where their specified property's value is identical to the given value
   * (`item[prop] === value`).
   * @param {string} prop The property to test against
   * @param {*} value The expected value
   * @returns {Array}
   * @example
   * enmap.findAll('username', 'Bob');
   */
  findAll(prop, value) {
    if (typeof prop !== 'string') throw new TypeError('Key must be a string.');
    if (isNil(value)) throw new Error('Value must be specified.');
    const results = [];
    for (const item of this.values()) {
      if (
        item[prop] === value ||
        (isObject(item) && _get(item, prop) === value)
      )
        results.push(item);
    }
    return results;
  }

  /**
   * Searches for a single item where its specified property's value is identical to the given value
   * (`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is identical to
   * [Array.find()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find).
   * <warn>All Enmap used in Discord.js are mapped using their `id` property, and if you want to find by id you
   * should use the `get` method. See
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get) for details.</warn>
   * @param {string|Function} propOrFn The property to test against, or the function to test with
   * @param {*} [value] The expected value - only applicable and required if using a property for the first argument
   * @returns {*}
   * @example
   * enmap.find('username', 'Bob');
   * @example
   * enmap.find(val => val.username === 'Bob');
   */
  find(propOrFn, value) {
    this.#readyCheck();
    if (isNil(propOrFn) || (!isFunction(propOrFn) && isNil(value))) {
      throw new Err(
        'find requires either a prop and value, or a function. One of the provided arguments was null or undefined',
        'EnmapArgumentError',
      );
    }
    const func = isFunction(propOrFn)
      ? propOrFn
      : //@ts-ignore
        (v) => value === _get(v, propOrFn);
    for (const [key, val] of this) {
      if (func(val, key, this)) return val;
    }
    return null;
  }

  /**
   * Searches for the key of a single item where its specified property's value is identical to the given value
   * (`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is identical to
   * [Array.findIndex()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex).
   * @param {string|Function} propOrFn The property to test against, or the function to test with
   * @param {*} [value] The expected value - only applicable and required if using a property for the first argument
   * @returns {string|number}
   * @example
   * enmap.findKey('username', 'Bob');
   * @example
   * enmap.findKey(val => val.username === 'Bob');
   */
  findKey(propOrFn, value) {
    this.#readyCheck();
    if (typeof propOrFn === 'string') {
      if (isNil(value)) throw new Error('Value must be specified.');
      for (const [key, val] of this) {
        if (
          val[propOrFn] === value ||
          (isObject(val) && _get(val, propOrFn) === value)
        )
          return key;
      }
      return null;
    } else if (typeof propOrFn === 'function') {
      for (const [key, val] of this) {
        if (propOrFn(val, key, this)) return key;
      }
      return null;
    }
    throw new Error('First argument must be a property string or a function.');
  }

  /**
   * Removes entries that satisfy the provided filter function.
   * @param {Function} fn Function used to test (should return a boolean)
   * @param {Object} [thisArg] Value to use as `this` when executing function
   * @returns {number} The number of removed entries
   */
  sweep(fn, thisArg) {
    this.#readyCheck();
    if (thisArg) fn = fn.bind(thisArg);
    const previousSize = this.size;
    for (const [key, val] of this) {
      if (fn(val, key, this)) this.delete(key);
    }
    return previousSize - this.size;
  }

  /**
   * Identical to
   * [Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter),
   * but returns a Enmap instead of an Array.
   * @param {Function} fn Function used to test (should return a boolean)
   * @param {Object} [thisArg] Value to use as `this` when executing function
   * @returns {Enmap}
   */
  filter(fn, thisArg) {
    this.#readyCheck();
    if (thisArg) fn = fn.bind(thisArg);
    const results = new Enmap();
    for (const [key, val] of this) {
      if (fn(val, key, this)) results.set(key, val);
    }
    return results;
  }

  /**
   * Identical to
   * [Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).
   * @param {Function} fn Function used to test (should return a boolean)
   * @param {Object} [thisArg] Value to use as `this` when executing function
   * @returns {Array}
   */
  filterArray(fn, thisArg) {
    this.#readyCheck();
    if (thisArg) fn = fn.bind(thisArg);
    const results = [];
    for (const [key, val] of this) {
      if (fn(val, key, this)) results.push(val);
    }
    return results;
  }

  /**
   * Identical to
   * [Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).
   * @param {Function} fn Function that produces an element of the new array, taking three arguments
   * @param {*} [thisArg] Value to use as `this` when executing function
   * @returns {Array}
   */
  map(fn, thisArg) {
    this.#readyCheck();
    if (thisArg) fn = fn.bind(thisArg);
    const arr = new Array(this.size);
    let i = 0;
    for (const [key, val] of this) arr[i++] = fn(val, key, this);
    return arr;
  }

  /**
   * Identical to
   * [Array.some()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some).
   * @param {Function} fn Function used to test (should return a boolean)
   * @param {Object} [thisArg] Value to use as `this` when executing function
   * @returns {boolean}
   */
  some(fn, thisArg) {
    this.#readyCheck();
    if (thisArg) fn = fn.bind(thisArg);
    for (const [key, val] of this) {
      if (fn(val, key, this)) return true;
    }
    return false;
  }

  /**
   * Identical to
   * [Array.every()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every).
   * @param {Function} fn Function used to test (should return a boolean)
   * @param {Object} [thisArg] Value to use as `this` when executing function
   * @returns {boolean}
   */
  every(fn, thisArg) {
    this.#readyCheck();
    if (thisArg) fn = fn.bind(thisArg);
    for (const [key, val] of this) {
      if (!fn(val, key, this)) return false;
    }
    return true;
  }

  /**
   * Identical to
   * [Array.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce).
   * @param {Function} fn Function used to reduce, taking four arguments; `accumulator`, `currentValue`, `currentKey`,
   * and `enmap`
   * @param {*} [initialValue] Starting value for the accumulator
   * @returns {*}
   */
  reduce(fn, initialValue) {
    this.#readyCheck();
    let accumulator;
    if (typeof initialValue !== 'undefined') {
      accumulator = initialValue;
      for (const [key, val] of this)
        accumulator = fn(accumulator, val, key, this);
    } else {
      let first = true;
      for (const [key, val] of this) {
        if (first) {
          accumulator = val;
          first = false;
          continue;
        }
        accumulator = fn(accumulator, val, key, this);
      }
    }
    return accumulator;
  }

  /**
   * Creates an identical shallow copy of this Enmap.
   * @returns {Enmap}
   * @example const newColl = someColl.clone();
   */
  clone() {
    this.#readyCheck();
    return new Enmap(this);
  }

  /**
   * Combines this Enmap with others into a new Enmap. None of the source Enmaps are modified.
   * @param {...Enmap} enmaps Enmaps to merge
   * @returns {Enmap}
   * @example const newColl = someColl.concat(someOtherColl, anotherColl, ohBoyAColl);
   */
  concat(...enmaps) {
    this.#readyCheck();
    const newColl = this.clone();
    for (const coll of enmaps) {
      for (const [key, val] of coll) newColl.set(key, val);
    }
    return newColl;
  }

  /* DEPRECATED METHODS */
  /* TO BE REMOVED IN VERSION 6 */

  /**
   * Partitions the enmap into two enmaps where the first enmap
   * contains the items that passed and the second contains the items that failed.
   * DEPRECATION WILL BE REMOVED IN ENMAP 6!
   * @param {Function} fn Function used to test (should return a boolean)
   * @param {*} [thisArg] Value to use as `this` when executing function
   * @returns {Enmap[]}
   * @example const [big, small] = enmap.partition(guild => guild.memberCount > 250);
   * @deprecated Will be removed in Enmap 6!
   */
  partition(fn, thisArg) {
    process.emitWarning(
      'ENMAP DEPRECATION partition() will be removed in the next major Enmap release (v6)!',
    );
    this.#readyCheck();
    if (typeof thisArg !== 'undefined') fn = fn.bind(thisArg);
    const results = [new Enmap(), new Enmap()];
    for (const [key, val] of this) {
      if (fn(val, key, this)) {
        results[0].set(key, val);
      } else {
        results[1].set(key, val);
      }
    }
    return results;
  }

  /**
   * Checks if this Enmap shares identical key-value pairings with another.
   * This is different to checking for equality using equal-signs, because
   * the Enmaps may be different objects, but contain the same data.
   * DEPRECATION WILL BE REMOVED IN ENMAP 6!
   * @param {Enmap} enmap Enmap to compare with
   * @returns {boolean} Whether the Enmaps have identical contents
   * @deprecated Will be removed in Enmap 6!
   */
  equals(enmap) {
    process.emitWarning(
      'ENMAP DEPRECATION equals() will be removed in the next major Enmap release (v6)!',
    );
    this.#readyCheck();
    if (!enmap) return false;
    if (this === enmap) return true;
    if (this.size !== enmap.size) return false;
    return !this.find((value, key) => {
      const testVal = enmap.get(key);
      return testVal !== value || (testVal === undefined && !enmap.has(key));
    });
  }

  /**
   * Modify the property of a value inside the enmap, if the value is an object or array.
   * This is a shortcut to loading the key, changing the value, and setting it back.
   * DEPRECATION WILL BE REMOVED IN ENMAP 6! Use set() instead!
   * @param {string} key Required. The key of the element to add to The Enmap or array.
   * This value MUST be a string or number.
   * @param {string} path Required. The property to modify inside the value object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @param {*} val Required. The value to apply to the specified property.
   * @returns {Enmap} The enmap.
   * @deprecated Will be removed in Enmap 6!
   */
  setProp(key, path, val) {
    process.emitWarning(
      'ENMAP DEPRECATION setProp() will be removed in the next major Enmap release (v6)! Please use set(key, value, path) instead.',
    );
    this.#readyCheck();
    if (isNil(path))
      throw new Err(
        `No path provided to set a property in "${key}" of enmap "${
          this.#name
        }"`,
        'EnmapPathError',
      );
    return this.set(key, val, path);
  }

  /**
   * Push to an array element inside an Object or Array element in Enmap.
   * DEPRECATION WILL BE REMOVED IN ENMAP 6! Use push() instead!
   * @param {string} key Required. The key of the element.
   * This value MUST be a string or number.
   * @param {string} path Required. The name of the array property to push to.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @param {*} val Required. The value push to the array property.
   * @param {boolean} allowDupes Allow duplicate values in the array (default: false).
   * @returns {Enmap} The enmap.
   * @deprecated Will be removed in Enmap 6!
   */
  pushIn(key, path, val, allowDupes = false) {
    process.emitWarning(
      'ENMAP DEPRECATION pushIn() will be removed in the next major Enmap release (v6)! Please use push(key, value, path) instead.',
    );
    this.#readyCheck();
    this.#fetchCheck(key);
    if (isNil(path))
      throw new Err(
        `No path provided to push a value in "${key}" of enmap "${this.#name}"`,
        'EnmapPathError',
      );
    return this.push(key, val, path, allowDupes);
  }

  /**
   * Returns the specific property within a stored value. If the key does not exist or the value is not an object, throws an error.
   * DEPRECATION WILL BE REMOVED IN ENMAP 6! Use get() instead!
   * @param {string} key Required. The key of the element to get from The Enmap.
   * @param {string} path Required. The property to retrieve from the object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @return {*} The value of the property obtained.
   * @deprecated Will be removed in Enmap 6!
   */
  getProp(key, path) {
    process.emitWarning(
      'ENMAP DEPRECATION getProp() will be removed in the next major Enmap release (v6)! Please use get(key, path) instead.',
    );
    this.#readyCheck();
    this.#fetchCheck(key);
    if (isNil(path))
      throw new Err(
        `No path provided to get a property from "${key}" of enmap "${
          this.#name
        }"`,
        'EnmapPathError',
      );
    return this.get(key, path);
  }

  /**
   * Delete a property from an object or array value in Enmap.
   * DEPRECATION WILL BE REMOVED IN ENMAP 6! Use delete() instead!
   * @param {string} key Required. The key of the element to delete the property from in Enmap.
   * @param {string} path Required. The name of the property to remove from the object.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @deprecated Will be removed in Enmap 6! Use delete() instead!
   */
  deleteProp(key, path) {
    process.emitWarning(
      'ENMAP DEPRECATION deleteProp() will be removed in the next major Enmap release (v6)! Please use delete(key, path) instead.',
    );
    this.#readyCheck();
    this.#fetchCheck(key);
    if (isNil(path))
      throw new Err(
        `No path provided to delete a property in "${key}" of enmap "${
          this.#name
        }"`,
        'EnmapPathError',
      );
    this.delete(key, path);
  }

  /**
   * Remove a value from an Array or Object property inside an Array or Object element in Enmap.
   * Confusing? Sure is.
   * DEPRECATION WILL BE REMOVED IN ENMAP 6! Use remove() instead!
   * @param {string} key Required. The key of the element.
   * This value MUST be a string or number.
   * @param {string} path Required. The name of the array property to remove from.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @param {*} val Required. The value to remove from the array property.
   * @returns {Enmap} The enmap.
   * @deprecated Will be removed in Enmap 6! Use remove() instead!
   */
  removeFrom(key, path, val) {
    process.emitWarning(
      'ENMAP DEPRECATION removeFrom() will be removed in the next major Enmap release (v6)! Please use remove(key, value, path) instead.',
    );
    this.#readyCheck();
    this.#fetchCheck(key);
    if (isNil(path))
      throw new Err(
        `No path provided to remove an array element in "${key}" of enmap "${
          this.#name
        }"`,
        'EnmapPathError',
      );
    return this.remove(key, val, path);
  }

  /**
   * Returns whether or not the property exists within an object or array value in enmap.
   * DEPRECATION WILL BE REMOVED IN ENMAP 6! Use has() instead!
   * @param {string} key Required. The key of the element to check in the Enmap or array.
   * @param {*} path Required. The property to verify inside the value object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @return {boolean} Whether the property exists.
   * @deprecated Will be removed in Enmap 6! Use has() instead!
   */
  hasProp(key, path) {
    process.emitWarning(
      'ENMAP DEPRECATION hasProp() will be removed in the next major Enmap release (v6)! Please use has(key, path) instead.',
    );
    this.#readyCheck();
    this.#fetchCheck(key);
    if (isNil(path))
      throw new Err(
        `No path provided to check for a property in "${key}" of enmap "${
          this.#name
        }"`,
        'EnmapPathError',
      );
    return this.has(key, path);
  }

  /**
   * Searches for the existence of a single item where its specified property's value is identical to the given value
   * (`item[prop] === value`).
   * <warn>Do not use this to check for an item by its ID. Instead, use `enmap.has(id)`. See
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has) for details.</warn>
   * DEPRECATION WILL BE REMOVED IN ENMAP 6! Use has("key", "path") instead!
   * @param {string} prop The property to test against
   * @param {*} value The expected value
   * @returns {boolean}
   * @example
   * if (enmap.exists('username', 'Bob')) {
   *  console.log('user here!');
   * }
   * @deprecated Will be removed in Enmap 6! Use has(key, path) instead!
   */
  exists(prop, value) {
    process.emitWarning(
      'ENMAP DEPRECATION exists() will be removed in the next major Enmap release (v6)! Please use has(key, path) instead.',
    );
    this.#readyCheck();
    return Boolean(this.find(prop, value));
  }

  /* END DEPRECATED METHODS */
}

module.exports = Enmap;

/**
 * @external forEach
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/forEach}
 */

/**
 * @external keys
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/keys}
 */

/**
 * @external values
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/values}
 */
