// Lodash should probably be a core lib but hey, it's useful!
const {
  get: _get,
  set: _set,
  has: _has,
  delete: _delete,
  isNil,
  isFunction,
  isArray,
  isObject,
  toPath,
  merge,
  clone,
  cloneDeep,
} = require('lodash');

// Custom error codes with stack support.
const Err = require('./error.js');

// Native imports
const { resolve, sep } = require('path');
const fs = require('fs');

// Package.json
const pkgdata = require('../package.json');

// Symbols are used to create "private" methods.
// https://medium.com/front-end-hacking/private-methods-in-es6-and-writing-your-own-db-b2e30866521f
const _mathop = Symbol('mathop');
const _check = Symbol('check');
const _validateName = Symbol('validateName');
const _fetchCheck = Symbol('fetchCheck');
const _parseData = Symbol('parseData');
const _readyCheck = Symbol('readyCheck');
const _clone = Symbol('clone');
const _init = Symbol('init');
const _defineSetting = Symbol('_defineSetting');

/**
 * A enhanced Map structure with additional utility methods.
 * Can be made persistent
 * @extends {Map}
 */
class Enmap extends Map {

  /**
   * Initializes a new Enmap, with options.
   * @param {iterable|string} iterable If iterable data, only valid in non-persistent enmaps.
   * If this parameter is a string, it is assumed to be the enmap's name, which is a shorthand for adding a name in the options
   * and making the enmap persistent.
   * @param {Object} [options] Additional options for the enmap. See https://enmap.evie.codes/usage#enmap-options for details.
   * @param {string} [options.name] The name of the enmap. Represents its table name in sqlite. If present, the enmap is persistent.
   * If no name is given, the enmap is memory-only and is not saved in the database. As a shorthand, you may use a string for the name
   * instead of the options (see example).
   * @param {boolean} [options.fetchAll] Defaults to `true`. When enabled, will automatically fetch any key that's requested using get,
   * getProp, etc. This is a "syncroneous" operation, which means it doesn't need any of this promise or callback use.
   * @param {string} [options.dataDir] Defaults to `./data`. Determines where the sqlite files will be stored. Can be relative
   * (to your project root) or absolute on the disk. Windows users , remember to escape your backslashes!
   * @param {string} [options.cloneLevel] Defaults to deep. Determines how objects and arrays are treated when inserting and retrieving from the database.
   * See https://enmap.evie.codes/usage#enmap-options for more details on this option.
   * @param {boolean} [options.polling] defaults to `false`. Determines whether Enmap will attempt to retrieve changes from the database on a regular interval.
   * This means that if another Enmap in another process modifies a value, this change will be reflected in ALL enmaps using the polling feature.
   * @param {string} [options.pollingInterval] defaults to `1000`, polling every second. Delay in milliseconds to poll new data from the database.
   * The shorter the interval, the more CPU is used, so it's best not to lower this. Polling takes about 350-500ms if no data is found, and time will
   * grow with more changes fetched. In my tests, 15 rows took a little more than 1 second, every second.
   * @param {boolean} [options.ensureProps] defaults to `false`. If enabled and the value in the enmap is an object, using ensure() will also ensure that
   * every property present in the default object will be added to the value, if it's absent. See ensure API reference for more information.
   * @param {boolean} [options.strictType] defaults to `false`. If enabled, locks the enmap to the type of the first value written to it (such as Number or String or Object).
   * Do not enable this option if your enmap contains different types of value or the enmap will fail to load.
   * @param {string} [options.typeLock] Only used if strictType is enabled. Defines an initial type for every value entered in the enmap. If no value is
   * provided, the first value written to enmap will determine its typeLock. Must be a valid JS Primitive name, such as String, Number, Object, Array.
   * @param {boolean} [options.wal=false] Check out Write-Ahead Logging: https://www.sqlite.org/wal.html
   * @example
   * const Enmap = require("enmap");
   * // Non-persistent enmap:
   * const inMemory = new Enmap();
   *
   * // Named, Persistent enmap with string option
   * const myEnmap = new Enmap("testing");
   *
   * // Named, Persistent enmap with a few options:
   * const myEnmap = new Enmap({name: "testing", fetchAll: false, autoFetch: true});
   */
  constructor(iterable, options = {}) {
    if (typeof iterable === 'string') {
      options.name = iterable;
      iterable = null;
    }
    if (!iterable || typeof iterable[Symbol.iterator] !== 'function') {
      options = iterable || options;
      iterable = null;
    }
    super();

    let cloneLevel;
    if (options.cloneLevel) {
      const accepted = ['none', 'shallow', 'deep'];
      if (!accepted.includes(options.cloneLevel)) throw new Err('Unknown Clone Level. Options are none, shallow, deep. Default is deep.', 'EnmapOptionsError');
      cloneLevel = options.cloneLevel; // eslint-disable-line prefer-destructuring
    } else {
      cloneLevel = 'deep';
    }

    // Object.defineProperty ensures that the property is "hidden" when outputting
    // the enmap in console. Only actual map entries are shown using this method.
    this[_defineSetting]('cloneLevel', 'String', true, cloneLevel);
    this[_defineSetting]('ensureProps', 'Boolean', true, false, options.ensureProps);

    if (options.name) {
      const Database = require('better-sqlite3');
      this[_defineSetting]('persistent', 'Boolean', false, true);

      // Initialize this property, to prepare for a possible destroy() call.
      // This is completely ignored in all situations except destroying the enmap.
      this[_defineSetting]('isDestroyed', 'Boolean', true, false);

      // Define the data directory where the enmap is stored.
      if (!options.dataDir) {
        if (!fs.existsSync('./data')) {
          fs.mkdirSync('./data');
        }
      }

      const dataDir = resolve(process.cwd(), options.dataDir || 'data');
      const database = new Database(`${dataDir}${sep}enmap.sqlite`);

      // [_defineSetting](name, type, writable, defaultValue [, value]) {

      this[_defineSetting]('name', 'String', true, options.name);
      this[_defineSetting]('dataDir', 'String', false, dataDir);
      this[_defineSetting]('fetchAll', 'Boolean', true, true, options.fetchAll);
      this[_defineSetting]('database', 'Database', true, database);
      this[_defineSetting]('autoFetch', 'Boolean', true, true, options.autoFetch);
      this[_defineSetting]('strictType', 'Boolean', true, false, options.strictType);
      this[_defineSetting]('wal', 'Boolean', true, true, options.wal);
      Object.defineProperty(this, 'typeLock', {
        value: options.typeLock || null,
        writable: true,
        enumerable: false,
        configurable: false
      });
      this[_defineSetting]('polling', 'Boolean', true, false, options.polling);
      this[_defineSetting]('pollingInterval', 'Number', true, 1000, options.pollingInterval);
      this[_defineSetting]('defer', 'Promise', true, new Promise((res) =>
        this[_defineSetting]('ready', 'Function', false, res))
      );

      this[_validateName]();
      this[_init](database);
    } else {
      this[_defineSetting]('name', 'String', true, 'MemoryEnmap');
      this[_defineSetting]('isReady', 'Boolean', true, true);
    }

    if (iterable) {
      if (options.name) {
        console.log(`Iterable ignored for persistent Enmap ${options.name}`);
      } else {
        for (const [key, value] of iterable) {
          this.set(key, value);
        }
      }
    }
  }

  /**
   * Sets a value in Enmap.
   * @param {string|number} key Required. The key of the element to add to The Enmap.
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
   * enmap.set('IhazObjects', 'color', 'blue'); //modified previous object
   * enmap.set('ArraysToo', 2, 'three'); // changes "tree" to "three" in array.
   * @returns {Enmap} The enmap.
   */
  set(key, val, path = null) {
    this[_readyCheck]();
    if (isNil(key) || !['String', 'Number'].includes(key.constructor.name)) {
      throw new Err('Enmap require keys to be strings or numbers.', 'EnmapKeyTypeError');
    }
    key = key.toString();
    this[_fetchCheck](key);
    let data = super.get(key);
    const oldValue = super.has(key) ? this[_clone](data) : null;
    if (!isNil(path)) {
      if (isNil(data)) data = {};
      _set(data, path, val);
    } else {
      // New 4.6.0: typecheck
      if (this.strictType) {
        if (!this.typeLock) {
          this[_defineSetting]('typeLock', 'String', true, val.constructor.name);
        } else if (data && data.constructor.name !== val.constructor.name) {
          throw new Err(`Enmap "${this.name}" requires data to be of type "${data.constructor.name}" (got: "${val.constructor.name}" instead)`, 'EnmapStrictDataError');
        } else if (!data && this.typeLock !== val.constructor.name) {
          throw new Err(`Enmap "${this.name}" requires data to be of type "${this.typeLock}" (got: "${val.constructor.name}" instead)`, 'EnmapStrictDataError');
        }
      }
      // end new
      data = val;
    }
    if (isFunction(this.changedCB)) {
      this.changedCB(key, oldValue, data);
    }
    if (this.persistent) {
      this.db.prepare(`INSERT OR REPLACE INTO ${this.name} (key, value) VALUES (?, ?);`).run(key, JSON.stringify(data));
      if (this.polling) {
        this.db.prepare(`INSERT INTO 'internal::changes::${this.name}' (type, key, value, timestamp, pid) VALUES (?, ?, ?, ?, ?);`).run('insert', key, JSON.stringify(data), Date.now(), process.pid);
      }
    }
    return super.set(key, this[_clone](data));
  }

  /**
   * Retrieves a key from the enmap. If fetchAll is false, returns a promise.
   * @param {string|number} key The key to retrieve from the enmap.
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
    this[_readyCheck]();
    if (isNil(key)) return null;
    this[_fetchCheck](key);
    key = key.toString();
    if (!isNil(path)) {
      this[_check](key, ['Object', 'Array']);
      const data = super.get(key);
      return _get(data, path);
    }
    const data = super.get(key);
    return this[_clone](data);
  }

  /**
   * Retrieves the number of rows in the database for this enmap, even if they aren't fetched.
   * @return {integer} The number of rows in the database.
   */
  get count() {
    const data = this.db.prepare(`SELECT count(*) FROM '${this.name}';`).get();
    return data['count(*)'];
  }

  /**
   * Retrieves all the indexes (keys) in the database for this enmap, even if they aren't fetched.
   * @return {array<string>} Array of all indexes (keys) in the enmap, cached or not.
   */
  get indexes() {
    const rows = this.db.prepare(`SELECT key FROM '${this.name}';`).all();
    return rows.map(row => row.key);
  }

  /**
   * Migrates an Enmap from version 3 or lower to a Version 4 enmap, which is locked to sqlite backend only.
   * This migration MUST be executed in version 3.1.4 of Enmap, along with appropriate providers.
   * See https://enmap.evie.codes/install/upgrade for more details.
   */
  static async migrate() {
    throw new Err('PLEASE DOWNGRADE TO ENMAP@3.1.4 TO USE THE MIGRATE TOOL', 'EnmapMigrationError');
  }

  /**
   * Fetches every key from the persistent enmap and loads them into the current enmap value.
   * @return {Enmap} The enmap containing all values.
   */
  fetchEverything() {
    this[_readyCheck]();
    const rows = this.db.prepare(`SELECT * FROM ${this.name};`).all();
    for (const row of rows) {
      const val = this[_parseData](row.value);
      if (this.strictType && !this.typeLock) {
        this[_defineSetting]('typeLock', 'String', true, val.constructor.name);
      } else if (this.strictType && this.typeLock && val.constructor.name !== this.typeLock) {
        throw new Err(`Enmap "${this.name}" requires data to be of type "${this.typeLock}" (found: "${val.constructor.name}" in database instead)`, 'EnmapStrictDataError');
      }
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
    this[_readyCheck]();
    if (isArray(keyOrKeys)) {
      const data = this.db.prepare(`SELECT * FROM ${this.name} WHERE key IN (${'?, '.repeat(keyOrKeys.length).slice(0, -2)})`).all(keyOrKeys);
      for (const row of data) {
        super.set(row.key, this[_parseData](row.value));
      }
      return this;
    } else {
      const data = this.db.prepare(`SELECT * FROM ${this.name} WHERE key = ?;`).get(keyOrKeys);
      if (!data) return null;
      super.set(keyOrKeys, this[_parseData](data.value));
      return this[_parseData](data.value);
    }
  }

  /**
   * Removes a key or keys from the cache - useful when disabling autoFetch.
   * @param {string|number|Array<string|number>} keyOrArrayOfKeys A single key or array of keys to remove from the cache.
   * @returns {Enmap} The enmap minus the evicted keys.
   */
  evict(keyOrArrayOfKeys) {
    if (isArray(keyOrArrayOfKeys)) {
      keyOrArrayOfKeys.forEach(key => super.delete(key));
    } else {
      super.delete(keyOrArrayOfKeys);
    }
    return this;
  }

  /**
   * Generates an automatic numerical key for inserting a new value.
   * This is a "weak" method, it ensures the value isn't duplicated, but does not
   * guarantee it's sequential (if a value is deleted, another can take its place).
   * Useful for logging, but not much else.
   * @example
   * enmap.set(enmap.autonum, "This is a new value");
   * @return {number} The generated key number.
   */
  get autonum() {
    let { lastnum } = this.db.prepare("SELECT lastnum FROM 'internal::autonum' WHERE enmap = ?").get(this.name);
    lastnum++;
    this.db.prepare("INSERT OR REPLACE INTO 'internal::autonum' (enmap, lastnum) VALUES (?, ?)").run(this.name, lastnum);
    return lastnum;
  }

  /**
   * Function called whenever data changes within Enmap after the initial load.
   * Can be used to detect if another part of your code changed a value in enmap and react on it.
   * @example
   * enmap.changed((keyName, oldValue, newValue) => {
   *   console.log(`Value of ${keyName} has changed from: \n${oldValue}\nto\n${newValue});
   * });
   * @param {Function} cb A callback function that will be called whenever data changes in the enmap.
   */
  changed(cb) {
    this.changedCB = cb;
  }

  /**
   * Shuts down the database. WARNING: USING THIS MAKES THE ENMAP UNUSEABLE. You should
   * only use this method if you are closing your entire application.
   * Note that honestly I've never had to use this, shutting down the app without a close() is fine.
   * @return {Promise<*>} The promise of the database closing operation.
   */
  close() {
    this[_readyCheck]();
    return this.database.close();
  }


  /**
   * Modify the property of a value inside the enmap, if the value is an object or array.
   * This is a shortcut to loading the key, changing the value, and setting it back.
   * @param {string|number} key Required. The key of the element to add to The Enmap or array.
   * This value MUST be a string or number.
   * @param {string} path Required. The property to modify inside the value object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @param {*} val Required. The value to apply to the specified property.
   * @returns {Enmap} The enmap.
   */
  setProp(key, path, val) {
    this[_readyCheck]();
    if (isNil(path)) throw new Err(`No path provided to set a property in "${key}" of enmap "${this.name}"`, 'EnmapPathError');
    return this.set(key, val, path);
  }

  /**
   * Push to an array value in Enmap.
   * @param {string|number} key Required. The key of the array element to push to in Enmap.
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
   * enmap.push("arrayInObject", "five", "sub"); adds "five" at the end of the sub array
   * @returns {Enmap} The enmap.
   */
  push(key, val, path = null, allowDupes = false) {
    this[_readyCheck]();
    this[_fetchCheck](key);
    this[_check](key, 'Array', path);
    const data = super.get(key);
    if (!isNil(path)) {
      const propValue = _get(data, path);
      if (!allowDupes && propValue.indexOf(val) > -1) return this;
      propValue.push(val);
      _set(data, path, propValue);
    } else {
      if (!allowDupes && data.indexOf(val) > -1) return this;
      data.push(val);
    }
    return this.set(key, data);
  }

  /**
   * Push to an array element inside an Object or Array element in Enmap.
   * @param {string|number} key Required. The key of the element.
   * This value MUST be a string or number.
   * @param {string} path Required. The name of the array property to push to.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @param {*} val Required. The value push to the array property.
   * @param {boolean} allowDupes Allow duplicate values in the array (default: false).
   * @returns {Enmap} The enmap.
   */
  pushIn(key, path, val, allowDupes = false) {
    this[_readyCheck]();
    this[_fetchCheck](key);
    if (isNil(path)) throw new Err(`No path provided to push a value in "${key}" of enmap "${this.name}"`, 'EnmapPathError');
    return this.push(key, val, path, allowDupes);
  }

  // AWESOME MATHEMATICAL METHODS

  /**
   * Executes a mathematical operation on a value and saves it in the enmap.
   * @param {string|number} key The enmap key on which to execute the math operation.
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
    this[_readyCheck]();
    this[_fetchCheck](key);
    this[_check](key, 'Number', path);
    if (isNil(path)) {
      if (operation === 'random' || operation === 'rand') {
        return this.set(key, Math.round(Math.random() * operand));
      }
      return this.set(key, this[_mathop](this.get(key), operation, operand));
    } else {
      const data = this.get(key);
      const propValue = _get(data, path);
      if (operation === 'random' || operation === 'rand') {
        return this.set(key, Math.round(Math.random() * propValue), path);
      }
      return this.set(key, this[_mathop](propValue, operation, operand), path);
    }
  }

  /**
   * Increments a key's value or property by 1. Value must be a number, or a path to a number.
   * @param {string|number} key The enmap key where the value to increment is stored.
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
    this[_readyCheck]();
    this[_check](key, 'Number', path);
    if (isNil(path)) {
      let val = this.get(key);
      return this.set(key, ++val);
    } else {
      const data = this.get(key);
      let propValue = _get(data, path);
      _set(data, path, ++propValue);
      return this.set(key, data);
    }
  }

  /**
   * Decrements a key's value or property by 1. Value must be a number, or a path to a number.
   * @param {string|number} key The enmap key where the value to decrement is stored.
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
    this[_readyCheck]();
    this[_check](key, 'Number', path);
    if (isNil(path)) {
      let val = this.get(key);
      return this.set(key, --val);
    } else {
      const data = this.get(key);
      let propValue = _get(data, path);
      _set(data, path, --propValue);
      return this.set(key, data);
    }
  }

  /**
   * Returns the specific property within a stored value. If the key does not exist or the value is not an object, throws an error.
   * @param {string|number} key Required. The key of the element to get from The Enmap.
   * @param {string} path Required. The property to retrieve from the object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @return {*} The value of the property obtained.
   */
  getProp(key, path) {
    this[_readyCheck]();
    this[_fetchCheck](key);
    if (isNil(path)) throw new Err(`No path provided to get a property from "${key}" of enmap "${this.name}"`, 'EnmapPathError');
    return this.get(key, path);
  }

  /**
   * Returns the key's value, or the default given, ensuring that the data is there.
   * This is a shortcut to "if enmap doesn't have key, set it, then get it" which is a very common pattern.
   * @param {string|number} key Required. The key you want to make sure exists.
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
    this[_readyCheck]();
    this[_fetchCheck](key);
    if (isNil(defaultValue)) throw new Err(`No default value provided on ensure method for "${key}" in "${this.name}"`, 'EnmapArgumentError');
    const clonedValue = this[_clone](defaultValue);
    if (!isNil(path)) {
      if (this.ensureProps) this.ensure(key, {});
      if (!super.has(key)) throw new Err(`Key "${key}" does not exist in "${this.name}" to ensure a property`, 'EnmapKeyError');
      if (this.hasProp(key, path)) return this.getProp(key, path);
      this.set(key, defaultValue, path);
      return defaultValue;
    }
    if (this.ensureProps && isObject(super.get(key))) {
      if (!isObject(clonedValue)) throw new Err(`Default value for "${key}" in enmap "${this.name}" must be an object when merging with an object value.`, 'EnmapArgumentError');
      // const merged = Object.assign(clonedValue, super.get(key));
      const merged = merge(clonedValue, super.get(key));
      super.set(key, merged);
      return merged;
    }
    if (super.has(key)) return super.get(key);
    this.set(key, clonedValue);
    return clonedValue;
  }

  /* BOOLEAN METHODS THAT CHECKS FOR THINGS IN ENMAP */

  /**
   * Returns whether or not the key exists in the Enmap.
   * @param {string|number} key Required. The key of the element to add to The Enmap or array.
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
    this[_readyCheck]();
    this[_fetchCheck](key);
    if (!isNil(path)) {
      this[_check](key, 'Object');
      const data = super.get(key);
      return _has(data, path);
    }
    return super.has(key);
  }

  /**
   * Returns whether or not the property exists within an object or array value in enmap.
   * @param {string|number} key Required. The key of the element to check in the Enmap or array.
   * @param {*} path Required. The property to verify inside the value object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @return {boolean} Whether the property exists.
   */
  hasProp(key, path) {
    this[_readyCheck]();
    this[_fetchCheck](key);
    if (isNil(path)) throw new Err(`No path provided to check for a property in "${key}" of enmap "${this.name}"`, 'EnmapPathError');
    return this.has(key, path);
  }

  /**
   * Performs Array.includes() on a certain enmap value. Works similar to
   * [Array.includes()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes).
   * @param {string|number} key Required. The key of the array to check the value of.
   * @param {string|number} val Required. The value to check whether it's in the array.
   * @param {*} path Required. The property to access the array inside the value object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @return {boolean} Whether the array contains the value.
   */
  includes(key, val, path = null) {
    this[_readyCheck]();
    this[_fetchCheck](key);
    this[_check](key, ['Array', 'Object']);
    const data = super.get(key);
    if (!isNil(path)) {
      const propValue = _get(data, path);
      if (isArray(propValue)) {
        return propValue.includes(val);
      }
      throw new Err(`The property "${path}" in key "${key}" is not an Array in the enmap "${this.name}" (property was of type "${propValue && propValue.constructor.name}")`, 'EnmapTypeError');
    } else if (isArray(data)) {
      return data.includes(val);
    }
    throw new Err(`The value of key "${key}" is not an Array in the enmap "${this.name}" (value was of type "${data && data.constructor.name}")`, 'EnmapTypeError');
  }

  /**
   * Deletes a key in the Enmap.
   * @param {string|number} key Required. The key of the element to delete from The Enmap.
   * @param {string} path Optional. The name of the property to remove from the object.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @returns {Enmap} The enmap.
   */
  delete(key, path = null) {
    this[_readyCheck]();
    this[_fetchCheck](key);
    const oldValue = this.get(key);
    if (!isNil(path)) {
      let data = this.get(key);
      path = toPath(path);
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
      if (this.persistent) {
        if (this.polling) {
          this.db.prepare(`INSERT INTO 'internal::changes::${this.name}' (type, key, timestamp, pid) VALUES (?, ?, ?, ?);`).run('delete', key.toString(), Date.now(), process.pid);
        }
        this.db.prepare(`DELETE FROM ${this.name} WHERE key = '${key}'`).run();
        return this;
      }
      if (typeof this.changedCB === 'function') {
        this.changedCB(key, oldValue, null);
      }
    }
    return this;
  }

  /**
   * Delete a property from an object or array value in Enmap.
   * @param {string|number} key Required. The key of the element to delete the property from in Enmap.
   * @param {string} path Required. The name of the property to remove from the object.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   */
  deleteProp(key, path) {
    this[_readyCheck]();
    this[_fetchCheck](key);
    if (isNil(path)) throw new Err(`No path provided to delete a property in "${key}" of enmap "${this.name}"`, 'EnmapPathError');
    this.delete(key, path);
  }

  /**
   * Deletes everything from the enmap. If persistent, clears the database of all its data for this table.
   */
  deleteAll() {
    this[_readyCheck]();
    if (this.persistent) {
      this.db.prepare(`DELETE FROM ${this.name};`).run();
      if (this.polling) {
        this.db.prepare(`INSERT INTO 'internal::changes::${this.name}' (type, timestamp, pid) VALUES (?, ?, ?);`).run('clear', Date.now(), process.pid);
      }
    }
    super.clear();
  }

  /**
   * Deletes everything from the enmap. If persistent, clears the database of all its data for this table.
   * @returns {null}
   */
  clear() { return this.deleteAll(); }

  /**
   * Completely destroys the entire enmap. This deletes the database tables entirely.
   * It will not affect other enmap data in the same database, however.
   * THIS ACTION WILL DESTROY YOUR DATA AND CANNOT BE UNDONE.
   * @returns {null}
   */
  destroy() {
    this.deleteAll();

    this.isDestroyed = true;

    const transaction = this.db.transaction((run) => {
      for (const stmt of run) {
        this.db.prepare(stmt).run();
      }
    });

    transaction([
      `DROP TABLE IF EXISTS ${this.name};`,
      `DROP TABLE IF EXISTS 'internal::changes::${this.name}';`,
      `DELETE FROM 'internal::autonum' WHERE enmap = '${this.name}';`
    ]);
    return null;
  }

  /**
   * Remove a value in an Array or Object element in Enmap. Note that this only works for
   * values, not keys. Complex values such as objects and arrays will not be removed this way.
   * @param {string|number} key Required. The key of the element to remove from in Enmap.
   * This value MUST be a string or number.
   * @param {*} val Required. The value to remove from the array or object.
   * @param {string} path Optional. The name of the array property to remove from.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3".
   * If not presents, removes directly from the value.
   * @returns {Enmap} The enmap.
   */
  remove(key, val, path = null) {
    this[_readyCheck]();
    this[_fetchCheck](key);
    this[_check](key, ['Array', 'Object']);
    const data = super.get(key);
    if (!isNil(path)) {
      const propValue = _get(data, path);
      if (isArray(propValue)) {
        propValue.splice(propValue.indexOf(val), 1);
        _set(data, path, propValue);
      } else if (isObject(propValue)) {
        _delete(data, `${path}.${val}`);
      }
    } else if (isArray(data)) {
      const index = data.indexOf(val);
      if (index > -1) {
        data.splice(index, 1);
      }
    } else if (isObject(data)) {
      delete data[val];
    }
    return this.set(key, data);
  }

  /**
   * Remove a value from an Array or Object property inside an Array or Object element in Enmap.
   * Confusing? Sure is.
   * @param {string|number} key Required. The key of the element.
   * This value MUST be a string or number.
   * @param {string} path Required. The name of the array property to remove from.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @param {*} val Required. The value to remove from the array property.
   * @returns {Enmap} The enmap.
   */
  removeFrom(key, path, val) {
    this[_readyCheck]();
    this[_fetchCheck](key);
    if (isNil(path)) throw new Err(`No path provided to remove an array element in "${key}" of enmap "${this.name}"`, 'EnmapPathError');
    return this.remove(key, val, path);
  }

  /**
   * Exports the enmap data to a JSON file.
   * **__WARNING__**: Does not work on memory enmaps containing complex data!
   * @returns {string} The enmap data in a stringified JSON format.
   */
  export() {
    this[_readyCheck]();
    if (this.persistent) this.fetchEverything();
    return JSON.stringify({
      name: this.name,
      version: pkgdata.version,
      exportDate: Date.now(),
      keys: this.map((value, key) => ({ key, value }))
    }, null, 2);
  }

  /**
   *
   * @param {string} data The data to import to Enmap. Must contain all the required fields provided by export()
   * @param {boolean} overwrite Defaults to `true`. Whether to overwrite existing key/value data with incoming imported data
   * @param {boolean} clear Defaults to `false`. Whether to clear the enmap of all data before importing
   * (**__WARNING__**: Any exiting data will be lost! This cannot be undone.)
   * @returns {Enmap} The enmap with the new data.
   */
  import(data, overwrite = true, clear = false) {
    this[_readyCheck]();
    if (clear) this.deleteAll();
    if (isNil(data)) throw new Err(`No data provided for import() in "${this.name}"`, 'EnmapImportError');
    try {
      const parsed = JSON.parse(data);
      for (const thisEntry of parsed.keys) {
        const { key, value } = thisEntry;
        if (!overwrite && this.has(key)) continue;
        this.set(key, value);
      }
    } catch (err) {
      throw new Err(`Data provided for import() in "${this.name}" is invalid JSON. Stacktrace:\n${err}`, 'EnmapImportError');
    }
    return this;
  }

  /**
   * Initialize multiple Enmaps easily.
   * @param {Array<string>} names Array of strings. Each array entry will create a separate enmap with that name.
   * @param {Object} options Options object to pass to the provider. See provider documentation for its options.
   * @example
   * // Using local variables.
   * const Enmap = require('enmap');
   * const { settings, tags, blacklist } = Enmap.multi(['settings', 'tags', 'blacklist']);
   *
   * // Attaching to an existing object (for instance some API's client)
   * const Enmap = require("enmap");
   * Object.assign(client, Enmap.multi(["settings", "tags", "blacklist"]));
   *
   * @returns {Array<Map>} An array of initialized Enmaps.
   */
  static multi(names, options = {}) {
    if (!names.length || names.length < 1) {
      throw new Err('"names" argument must be an array of string names.', 'EnmapTypeError');
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
   * @returns {Promise} Returns the defer promise to await the ready state.
   */
  async [_init](database) {
    Object.defineProperty(this, 'db', {
      value: database,
      writable: false,
      enumerable: false,
      configurable: false
    });
    if (this.db) {
      Object.defineProperty(this, 'isReady', {
        value: true,
        writable: false,
        enumerable: false,
        configurable: false
      });
    } else {
      throw new Err('Database Could Not Be Opened', 'EnmapDBConnectionError');
    }
    const table = this.db.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = ?;").get(this.name);
    if (!table['count(*)']) {
      this.db.prepare(`CREATE TABLE ${this.name} (key text PRIMARY KEY, value text)`).run();
      this.db.pragma('synchronous = 1');
      if (this.wal) this.db.pragma('journal_mode = wal');
    }
    this.db.prepare(`CREATE TABLE IF NOT EXISTS 'internal::changes::${this.name}' (type TEXT, key TEXT, value TEXT, timestamp INTEGER, pid INTEGER);`).run();
    this.db.prepare(`CREATE TABLE IF NOT EXISTS 'internal::autonum' (enmap TEXT PRIMARY KEY, lastnum INTEGER)`).run();
    if (this.fetchAll) {
      await this.fetchEverything();
    }
    // TEMPORARY MIGRATE CODE FOR AUTONUM
    if (this.has('internal::autonum')) {
      this.db.prepare("INSERT OR REPLACE INTO 'internal::autonum' (enmap, lastnum) VALUES (?, ?)").run(this.name, this.get('internal::autonum'));
      this.delete('internal::autonum');
    } else {
      const row = this.db.prepare("SELECT lastnum FROM 'internal::autonum' WHERE enmap = ?").get(this.name);
      if (!row) {
        this.db.prepare("INSERT INTO 'internal::autonum' (enmap, lastnum) VALUES (?, ?)").run(this.name, 0);
      }
    }

    if (this.polling) {
      Object.defineProperty(this, 'lastSync', {
        value: new Date(),
        writable: true,
        enumerable: false,
        configurable: false
      });
      setInterval(() => {
        const changes = this.db.prepare(`SELECT type, key, value FROM 'internal::changes::${this.name}' WHERE timestamp >= ? AND pid <> ? ORDER BY timestamp ASC;`)
          .all(this.lastSync.getTime(), process.pid);
        for (const row of changes) {
          switch (row.type) {
          case 'insert':
            super.set(row.key, this[_parseData](row.value));
            break;
          case 'delete':
            super.delete(row.key);
            break;
          case 'clear':
            super.clear();
            break;
          }
        }
        this.lastSync = new Date();
        this.db.prepare(`DELETE FROM 'internal::changes::${this.name}' WHERE ROWID IN (SELECT ROWID FROM 'internal::changes::${this.name}' ORDER BY ROWID DESC LIMIT -1 OFFSET 100);`).run();
      }, this.pollingInterval);
    }
    this.ready();
    return this.defer;
  }

  /*
   * INTERNAL method to verify the type of a key or property
   * Will THROW AN ERROR on wrong type, to simplify code.
   * @param {string|number} key Required. The key of the element to check
   * @param {string} type Required. The javascript constructor to check
   * @param {string} path Optional. The dotProp path to the property in the object enmap.
   */
  [_check](key, type, path = null) {
    if (!this.has(key)) throw new Err(`The key "${key}" does not exist in the enmap "${this.name}"`, 'EnmapPathError');
    if (!type) return;
    if (!isArray(type)) type = [type];
    if (!isNil(path)) {
      this[_check](key, 'Object');
      const data = super.get(key);
      if (isNil(_get(data, path))) {
        throw new Err(`The property "${path}" in key "${key}" does not exist. Please set() it or ensure() it."`, 'EnmapPathError');
      }
      if (!type.includes(_get(data, path).constructor.name)) {
        throw new Err(`The property "${path}" in key "${key}" is not of type "${type.join('" or "')}" in the enmap "${this.name}" 
(key was of type "${_get(data, path).constructor.name}")`, 'EnmapTypeError');
      }
    } else if (!type.includes(this.get(key).constructor.name)) {
      throw new Err(`The key "${key}" is not of type "${type.join('" or "')}" in the enmap "${this.name}" (key was of type "${this.get(key).constructor.name}")`, 'EnmapTypeError');
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
  [_mathop](base, op, opand) {
    if (base == undefined || op == undefined || opand == undefined) throw new Err('Math Operation requires base and operation', 'EnmapTypeError');
    switch (op) {
    case 'add' :
    case 'addition' :
    case '+' :
      return base + opand;
    case 'sub' :
    case 'subtract' :
    case '-' :
      return base - opand;
    case 'mult' :
    case 'multiply' :
    case '*' :
      return base * opand;
    case 'div' :
    case 'divide' :
    case '/' :
      return base / opand;
    case 'exp' :
    case 'exponent' :
    case '^' :
      return Math.pow(base, opand);
    case 'mod' :
    case 'modulo' :
    case '%' :
      return base % opand;
    }
    return null;
  }

  /**
   * Internal method used to validate persistent enmap names (valid Windows filenames)
   * @private
   */
  [_validateName]() {
    this.name = this.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  /*
   * Internal Method. Verifies if a key needs to be fetched from the database.
   * If persistent enmap and autoFetch is on, retrieves the key.
   * @param {string|number} key The key to check or fetch.
   */
  [_fetchCheck](key, force = false) {
    if (!['String', 'Number'].includes(key.constructor.name)) return;
    if (force) {
      this.fetch(key);
      return;
    }
    if (super.has(key)) return;
    if (!this.persistent || !this.autoFetch) return;
    this.fetch(key);
  }

  /*
   * Internal Method. Parses JSON data.
   * Reserved for future use (logical checking)
   * @param {*} data The data to check/parse
   * @returns {*} An object or the original data.
   */
  [_parseData](data) {
    return JSON.parse(data);
  }

  /*
   * Internal Method. Clones a value or object with the enmap's set clone level.
   * @param {*} data The data to clone.
   * @return {*} The cloned value.
   */
  [_clone](data) {
    if (this.cloneLevel === 'none') return data;
    if (this.cloneLevel === 'shallow') return clone(data);
    if (this.cloneLevel === 'deep') return cloneDeep(data);
    throw new Err('Invalid cloneLevel. What did you *do*, this shouldn\'t happen!', 'EnmapOptionsError');
  }

  /*
   * Internal Method. Verifies that the database is ready, assuming persistence is used.
   */
  [_readyCheck]() {
    if (!this.isReady) throw new Err('Database is not ready. Refer to the readme to use enmap.defer', 'EnmapReadyError');
    if (this.isDestroyed) throw new Err('This enmap has been destroyed and can no longer be used without being re-initialized.', 'EnmapDestroyedError');
  }

  /*
   * Internal Method. Defines a property with either user-provided value, or the default value.
   */
  [_defineSetting](name, type, writable, defaultValue, value) {
    if (isNil(value)) value = defaultValue;
    if (value.constructor.name !== type) {
      throw new Err(`Wrong value type provided for options.${name}:  Provided "${defaultValue.constructor.name}", expecting "${type}", in enmap "${this.name}".`);
    }
    Object.defineProperty(this, name, {
      value: !isNil(value) ? value : defaultValue,
      writable,
      enumerable: false,
      configurable: false
    });
  }

  /*
  BELOW IS DISCORD.JS COLLECTION CODE
  Per notes in the LICENSE file, this project contains code from Amish Shah's Discord.js
  library. The code is from the Collections object, in discord.js version 11.

  All below code is sourced from Collections.
  https://github.com/discordjs/discord.js/blob/stable/src/util/Collection.js
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
    if (typeof count !== 'number') throw new TypeError('The count must be a number.');
    if (!Number.isInteger(count) || count < 1) throw new RangeError('The count must be an integer greater than 0.');
    if (arr.length === 0) return [];
    const rand = new Array(count);
    arr = arr.slice();
    // eslint-disable-next-line
    for (let i = 0; i < count; i++) rand[i] = arr.splice(Math.floor(Math.random() * arr.length), 1)[0];
    // because, eslint, destructuring a for loop won't fricken happen, okay mate?
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
    if (typeof count !== 'number') throw new TypeError('The count must be a number.');
    if (!Number.isInteger(count) || count < 1) throw new RangeError('The count must be an integer greater than 0.');
    if (arr.length === 0) return [];
    const rand = new Array(count);
    arr = arr.slice();
    // eslint-disable-next-line
    for (let i = 0; i < count; i++) rand[i] = arr.splice(Math.floor(Math.random() * arr.length), 1)[0];
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
      if (item[prop] === value || (isObject(item) && _get(item, prop) === value)) results.push(item);
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
    if (typeof propOrFn === 'string') {
      if (isNil(value)) throw new Error('Value must be specified.');
      for (const item of this.values()) {
        if (item[propOrFn] === value || (isObject(item) && _get(item, propOrFn) === value)) return item;
      }
      return null;
    } else if (typeof propOrFn === 'function') {
      for (const [key, val] of this) {
        if (propOrFn(val, key, this)) return val;
      }
      return null;
    }
    throw new Error('First argument must be a property string or a function.');
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
    if (typeof propOrFn === 'string') {
      if (isNil(value)) throw new Error('Value must be specified.');
      for (const [key, val] of this) {
        if (val[propOrFn] === value || (isObject(val) && _get(val, propOrFn) === value)) return key;
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
   * Searches for the existence of a single item where its specified property's value is identical to the given value
   * (`item[prop] === value`).
   * <warn>Do not use this to check for an item by its ID. Instead, use `enmap.has(id)`. See
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has) for details.</warn>
   * @param {string} prop The property to test against
   * @param {*} value The expected value
   * @returns {boolean}
   * @example
   * if (enmap.exists('username', 'Bob')) {
   *  console.log('user here!');
   * }
   */
  exists(prop, value) {
    return Boolean(this.find(prop, value));
  }

  /**
   * Removes entries that satisfy the provided filter function.
   * @param {Function} fn Function used to test (should return a boolean)
   * @param {Object} [thisArg] Value to use as `this` when executing function
   * @returns {number} The number of removed entries
   */
  sweep(fn, thisArg) {
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
    if (thisArg) fn = fn.bind(thisArg);
    const results = new this.constructor();
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
    if (thisArg) fn = fn.bind(thisArg);
    const results = [];
    for (const [key, val] of this) {
      if (fn(val, key, this)) results.push(val);
    }
    return results;
  }

  /**
   * Partitions the collection into two collections where the first collection
   * contains the items that passed and the second contains the items that failed.
   * @param {Function} fn Function used to test (should return a boolean)
   * @param {*} [thisArg] Value to use as `this` when executing function
   * @returns {Collection[]}
   * @example const [big, small] = collection.partition(guild => guild.memberCount > 250);
   */
  partition(fn, thisArg) {
    if (typeof thisArg !== 'undefined') fn = fn.bind(thisArg);
    const results = [new this.constructor(), new this.constructor()];
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
   * Identical to
   * [Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).
   * @param {Function} fn Function that produces an element of the new array, taking three arguments
   * @param {*} [thisArg] Value to use as `this` when executing function
   * @returns {Array}
   */
  map(fn, thisArg) {
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
    let accumulator;
    if (typeof initialValue !== 'undefined') {
      accumulator = initialValue;
      for (const [key, val] of this) accumulator = fn(accumulator, val, key, this);
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
    return new this.constructor(this);
  }

  /**
   * Combines this Enmap with others into a new Enmap. None of the source Enmaps are modified.
   * @param {...Enmap} enmaps Enmaps to merge
   * @returns {Enmap}
   * @example const newColl = someColl.concat(someOtherColl, anotherColl, ohBoyAColl);
   */
  concat(...enmaps) {
    const newColl = this.clone();
    for (const coll of enmaps) {
      for (const [key, val] of coll) newColl.set(key, val);
    }
    return newColl;
  }

  /**
   * Checks if this Enmap shares identical key-value pairings with another.
   * This is different to checking for equality using equal-signs, because
   * the Enmaps may be different objects, but contain the same data.
   * @param {Enmap} enmap Enmap to compare with
   * @returns {boolean} Whether the Enmaps have identical contents
   */
  equals(enmap) {
    if (!enmap) return false;
    if (this === enmap) return true;
    if (this.size !== enmap.size) return false;
    return !this.find((value, key) => {
      const testVal = enmap.get(key);
      return testVal !== value || (testVal === undefined && !enmap.has(key));
    });
  }

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
