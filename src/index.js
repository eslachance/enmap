// Lodash should probably be a core lib but hey, it's useful!
import {
  get as _get,
  set as _set,
  has as _has,
  isNil,
  isFunction,
  isArray,
  isObject,
  toPath,
  merge,
  clone,
  cloneDeep,
} from 'lodash-es';
import onChange  from 'on-change';
import { makeDefer, waitForDefer, resolveDefer } from 'deferrals';

// Custom error codes with stack support.
import Err from './error.js';

// Package.json
// const pkgdata = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

/**
 * A enhanced Map structure with additional utility methods.
 * Can be made persistent
 * @extends {Map}
 */
class BriteLite extends Map {
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
  #db;
  /**
   * Initializes a new BriteLite, with options.
   * @param {Object} [options] Additional options for the britelite. See https://britelite.evie.codes/usage#britelite-options for details.
   * @param {*} [options.db] The D1 DB Instance passed from your worker - usually env.DB by default. Must be passed provided!
   * @param {string} [options.name] The name of the britelite. Represents its table name in sqlite. If present, the britelite is persistent.
   * If no name is given, the britelite is memory-only and is not saved in the database. As a shorthand, you may use a string for the name
   * instead of the options (see example).
   * @param {boolean} [options.fetchAll] Defaults to `true`. When enabled, will automatically fetch any key that's requested using get,
   * or other retrieval methods. This is a "synchronous" operation, which means it doesn't need any of this promise or callback use.
   * @param {string} [options.dataDir] Defaults to `./data`. Determines where the sqlite files will be stored. Can be relative
   * (to your project root) or absolute on the disk. Windows users , remember to escape your backslashes!
   * *Note*: Will not automatically create the folder if set manually, so make sure it exists.
   * @param {string} [options.cloneLevel] Defaults to deep. Determines how objects and arrays are treated when inserting and retrieving from the database.
   * See https://britelite.evie.codes/usage#britelite-options for more details on this option.
   * @param {boolean} [options.ensureProps] defaults to `true`. If enabled and the value in the britelite is an object, using ensure() will also ensure that
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
   * @example
   * const BriteLite = require("britelite-light");
   *
   * const myBriteLite = new BriteLite({ name: 'data', db: env.DB });
   *
   */
  constructor(options) {
    if (!options.db) {
      throw new Error('options.db not provided, cannot load D1 database!');
    }
    super();

    // Define local properties from the options.
    this.#off = Symbol('option_off');
    this.#fetchAll = options.fetchAll ?? false;
    this.#autoFetch = options.autoFetch ?? true;
    this.#autoEnsure = options.autoEnsure ?? this.#off;
    this.#ensureProps = options.ensureProps ?? true;
    this.#serializer = options.serializer ? options.serializer : (data) => data;
    this.#deserializer = options.deserializer
      ? options.deserializer
      : (data) => data;

    // CloneLevel is a little more involved... This'll be easier with TS :P
    this.#cloneLevel = options.cloneLevel ?? 'deep';
    if (!['none', 'shallow', 'deep'].includes(this.#cloneLevel)) {
      throw new Err(
        'Unknown Clone Level. Options are none, shallow, deep. Default is deep.',
        'BriteLiteOptionsError',
      );
    }

    this.#db = options.db;
    this.#name = options.name;
    this.#validateName();

    // Initialize this property, to prepare for a possible destroy() call.
    // This is completely ignored in all situations except destroying the britelite.
    this.#isDestroyed = false;
    makeDefer('dbready');
    this.ready = waitForDefer('dbready');
    this.#init();
  }

  /**
   * Sets a value in BriteLite.
   * @param {string} key Required. The key of the element to add to The BriteLite.
   * @param {*} val Required. The value of the element to add to The BriteLite.
   * If the BriteLite is persistent this value MUST be stringifiable as JSON.
   * @param {string} path Optional. The path to the property to modify inside the value object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @example
   * // Direct Value Examples
   * britelite.set('simplevalue', 'this is a string');
   * britelite.set('isBriteLiteGreat', true);
   * britelite.set('TheAnswer', 42);
   * britelite.set('IhazObjects', { color: 'black', action: 'paint', desire: true });
   * britelite.set('ArraysToo', [1, "two", "tree", "foor"])
   *
   * // Settings Properties
   * britelite.set('IhazObjects', 'blue', 'color'); //modified previous object
   * britelite.set('ArraysToo', 'three', 2); // changes "tree" to "three" in array.
   * @returns {BriteLite} The britelite.
   */
  //@ts-ignore
  async set(key, val, path = null) {
    if (isNil(key) || key.constructor.name !== 'String') {
      throw new Err(
        `BriteLite requires keys to be a string. Provided: ${
          isNil(key) ? 'nil' : key.constructor.name
        }`,
        'BriteLiteKeyTypeError',
      );
    }
    key = key.toString();
    let data = await this.get(key);
    const oldValue = await super.has(key) ? await this.#clone(data) : null;
    if (!isNil(path)) {
      if (isNil(data)) data = {};
      _set(data, path, val);
    } else {
      data = val;
    }
    if (isFunction(this.changedCB)) {
      this.changedCB(key, oldValue, data);
    }
    await this.#internalSet(key, data, false);
    return super.set(key, await this.#clone(data));
  }

  // eslint-disable-next-line valid-jsdoc
  /**
   * Update an existing object value in BriteLite by merging new keys. **This only works on objects**, any other value will throw an error.
   * Heavily inspired by setState from React's class components.
   * This is very useful if you have many different values to update and don't want to have more than one .set(key, value, prop) lines.
   * @param {string} key The key of the object to update.
   * @param {*} valueOrFunction Either an object to merge with the existing value, or a function that provides the existing object
   * and expects a new object as a return value. In the case of a straight value, the merge is recursive and will add any missing level.
   * If using a function, it is your responsibility to merge the objects together correctly.
   * @example
   * // Define an object we're going to update
   * britelite.set("obj", { a: 1, b: 2, c: 3 });
   *
   * // Direct merge
   * britelite.update("obj", { d: 4, e: 5 });
   * // obj is now { a: 1, b: 2, c: 3, d: 4, e: 5 }
   *
   * // Functional update
   * britelite.update("obj", (previous) => ({
   *   ...obj,
   *   f: 6,
   *   g: 7
   * }));
   * // this example takes heavy advantage of the spread operators.
   * // More info: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
   */
  async update(key, valueOrFunction) {
    await this.#readyCheck();
    if (isNil(key)) {
      throw new Err('Key not provided for update function', 'BriteLiteKeyError');
    }
    await this.#check(key, ['Object']);
    await this.#fetchCheck(key);
    const previousValue = await this.get(key);
    const fn = isFunction(valueOrFunction)
      ? valueOrFunction
      : () => merge(previousValue, valueOrFunction);
    const merged = fn(previousValue);
    await this.#internalSet(key, merged);
    return merged;
  }

  /**
   * Retrieves a key from the britelite.
   * @param {string} key The key to retrieve from the britelite.
   * @param {string} path Optional. The property to retrieve from the object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @example
   * const myKeyValue = britelite.get("myKey");
   * console.log(myKeyValue);
   *
   * const someSubValue = britelite.get("anObjectKey", "someprop.someOtherSubProp");
   * @return {*} The value for this key.
   */
  async get(key, path = null) {
    await this.#readyCheck();
    if (isNil(key)) return null;
    await this.#fetchCheck(key);
    key = key.toString();
    if (this.#autoEnsure !== this.#off && !(await this.has(key))) {
      await this.#internalSet(key, this.#autoEnsure);
    }
    const data = super.get(key);
    if (!isNil(path)) {
      await this.#check(key, ['Object', 'Array']);
      return _get(data, path);
    }
    return await this.#clone(data);
  }

  /**
   * Returns an observable object. Modifying this object or any of its properties/indexes/children
   * will automatically save those changes into britelite. This only works on
   * objects and arrays, not "basic" values like strings or integers.
   * @param {*} key The key to retrieve from the britelite.
   * @param {string} path Optional. The property to retrieve from the object or array.
   * @return {*} The value for this key.
   */
  async observe(key, path = null) {
    await this.#check(key, ['Object', 'Array'], path);
    const data = await this.get(key, path);
    const proxy = onChange(data, () => {
      this.set(key, proxy, path);
    });
    return proxy;
  }

  /**
   * Retrieves the number of rows in the database for this britelite, even if they aren't fetched.
   * @return {number} The number of rows in the database.
   */
  async count() {
    const { count } = await this.#db
      .prepare(`SELECT COUNT(*) as count FROM '${this.#name}';`)
      .first('count');
    return count;
  }

  /**
   * Retrieves all the indexes (keys) in the database for this britelite, even if they aren't fetched.
   * @return {Array<string>} Array of all indexes (keys) in the britelite, cached or not.
   */
  async indexes() {
    const { results } = await this.#db.prepare(`SELECT key FROM '${this.#name}';`).all();
    return results.map((row) => row.key);
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
   * Fetches every key from the persistent britelite and loads them into the current britelite value.
   * @return {BriteLite} The britelite containing all values.
   */
  async fetchEverything() {
    await this.#readyCheck();
    const results = await this.#db.prepare(`SELECT * FROM ${this.#name};`).all();
    console.log(results);
    for (const row of results) {
      const val = this.#parseData(row.value, row.key);
      super.set(row.key, val);
    }
    return this;
  }

  /**
   * Force fetch one or more key values from the britelite. If the database has changed, that new value is used.
   * @param {string|number|Array<string|number>} keyOrKeys A single key or array of keys to force fetch from the britelite database.
   * @return {BriteLite|*} The BriteLite, including the new fetched values, or the value in case the function argument is a single key.
   */
  async fetch(keyOrKeys) {
    await this.#readyCheck();
    if (isArray(keyOrKeys)) {
      const { results } = await this.#db
        .prepare(
          `SELECT * FROM ${this.#name} WHERE key IN (${'?, '
            .repeat(keyOrKeys.length)
            .slice(0, -2)})`,
        )
        .bind(keyOrKeys)
        .all();
      for (const row of results) {
        super.set(row.key, this.#parseData(row.value, row.key));
      }
      return this;
    } else {
      const data = await this.#db
        .prepare(`SELECT * FROM ${this.#name} WHERE key = ?;`)
        .bind(keyOrKeys)
        .first();
      if (!data) return null;
      const parsedData = await this.#parseData(data.value, keyOrKeys);
      super.set(keyOrKeys, parsedData);
      return parsedData;
    }
  }

  /**
   * Removes a key or keys from the cache - useful when disabling autoFetch.
   * @param {string|number|Array<string|number>} keyOrArrayOfKeys A single key or array of keys to remove from the cache.
   * @returns {BriteLite} The britelite minus the evicted keys.
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
   * britelite.set(britelite.autonum, "This is a new value");
   * @return {number} The generated key number.
   */
  async autonum() {
    let { lastnum } = await this.#db
      .prepare("SELECT lastnum FROM 'internal::autonum' WHERE britelite = ?")
      .bind(this.#name)
      .first('lastnum');
      lastnum++;
    await this.#db
      .prepare(
        "INSERT OR REPLACE INTO 'internal::autonum' (britelite, lastnum) VALUES (?, ?)",
      )
      .bind(this.#name, lastnum)
      .run();
    return lastnum.toString();
  }

  /**
   * Function called whenever data changes within BriteLite after the initial load.
   * Can be used to detect if another part of your code changed a value in britelite and react on it.
   * @example
   * britelite.changed((keyName, oldValue, newValue) => {
   *   console.log(`Value of ${keyName} has changed from: \n${oldValue}\nto\n${newValue}`);
   * });
   * @param {Function} cb A callback function that will be called whenever data changes in the britelite.
   */
  changed(cb) {
    this.changedCB = cb;
  }

  /**
   * Shuts down the database. USING THIS MAKES THE BRITELITE UNUSABLE. You should
   * only use this method if you are closing your entire application.
   * This is already done by BriteLite automatically on shutdown unless you disabled it.
   * @returns {BriteLite} The britelite.
   */
  async close() {
    await this.#readyCheck();
    await this.#db.close();
    return this;
  }

  /**
   * Push to an array value in BriteLite.
   * @param {string} key Required. The key of the array element to push to in BriteLite.
   * This value MUST be a string or number.
   * @param {*} val Required. The value to push to the array.
   * @param {string} path Optional. The path to the property to modify inside the value object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @param {boolean} allowDupes Optional. Allow duplicate values in the array (default: false).
   * @example
   * // Assuming
   * britelite.set("simpleArray", [1, 2, 3, 4]);
   * britelite.set("arrayInObject", {sub: [1, 2, 3, 4]});
   *
   * britelite.push("simpleArray", 5); // adds 5 at the end of the array
   * britelite.push("arrayInObject", "five", "sub"); // adds "five" at the end of the sub array
   * @returns {BriteLite} The britelite.
   */
  async push(key, val, path = null, allowDupes = false) {
    const data = await this.get(key);
    await this.#check(key, 'Array', path);
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
   * Executes a mathematical operation on a value and saves it in the britelite.
   * @param {string} key The britelite key on which to execute the math operation.
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
   * @returns {BriteLite} The britelite.
   */
  async math(key, operation, operand, path = null) {
    await this.#check(key, 'Number', path);
    const data = await this.get(key, path);
    return this.set(key, this.#mathop(data, operation, operand), path);
  }

  /**
   * Increments a key's value or property by 1. Value must be a number, or a path to a number.
   * @param {string} key The britelite key where the value to increment is stored.
   * @param {string} path Optional. The property path to increment, if the value is an object or array.
   * @example
   * // Assuming
   * points.set("number", 42);
   * points.set("numberInObject", {sub: { anInt: 5 }});
   *
   * points.inc("number"); // 43
   * points.inc("numberInObject", "sub.anInt"); // {sub: { anInt: 6 }}
   * @returns {BriteLite} The britelite.
   */
  async inc(key, path = null) {
    await this.#check(key, 'Number', path);
    if (isNil(path)) {
      let val = await this.get(key);
      return await  this.#internalSet(key, ++val);
    } else {
      const data = await this.get(key);
      let propValue = _get(data, path);
      _set(data, path, ++propValue);
      return this.#internalSet(key, data);
    }
  }

  /**
   * Decrements a key's value or property by 1. Value must be a number, or a path to a number.
   * @param {string} key The britelite key where the value to decrement is stored.
   * @param {string} path Optional. The property path to decrement, if the value is an object or array.
   * @example
   * // Assuming
   * points.set("number", 42);
   * points.set("numberInObject", {sub: { anInt: 5 }});
   *
   * points.dec("number"); // 41
   * points.dec("numberInObject", "sub.anInt"); // {sub: { anInt: 4 }}
   * @returns {BriteLite} The britelite.
   */
  async dec(key, path = null) {
    await this.#check(key, 'Number', path);
    if (isNil(path)) {
      let val = await this.get(key);
      return await this.#internalSet(key, --val);
    } else {
      const data = await this.get(key);
      let propValue = _get(data, path);
      _set(data, path, --propValue);
      return this.#internalSet(key, data);
    }
  }

  /**
   * Returns the key's value, or the default given, ensuring that the data is there.
   * This is a shortcut to "if britelite doesn't have key, set it, then get it" which is a very common pattern.
   * @param {string} key Required. The key you want to make sure exists.
   * @param {*} defaultValue Required. The value you want to save in the database and return as default.
   * @param {string} path Optional. If presents, ensures both the key exists as an object, and the full path exists.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @example
   * // Simply ensure the data exists (for using property methods):
   * britelite.ensure("mykey", {some: "value", here: "as an example"});
   * britelite.has("mykey"); // always returns true
   * britelite.get("mykey", "here") // returns "as an example";
   *
   * // Get the default value back in a variable:
   * const settings = mySettings.ensure("1234567890", defaultSettings);
   * console.log(settings) // britelite's value for "1234567890" if it exists, otherwise the defaultSettings value.
   * @return {*} The value from the database for the key, or the default value provided for a new key.
   */
  async ensure(key, defaultValue, path = null) {
    await this.#readyCheck();
    await this.#fetchCheck(key);
    if (this.#autoEnsure !== this.#off) {
      // eslint-disable-next-line max-len
      if (!isNil(defaultValue))
        console.error(
          `Saving "${key}" autoEnsure value was provided for this britelite but a default value has also been provided. The defaultValue will be ignored, autoEnsure value is used instead.`,
        );
      defaultValue = this.#autoEnsure;
    }
    if (isNil(defaultValue))
      throw new Err(
        `No default value provided on ensure method for "${key}" in "${
          this.#name
        }"`,
        'BriteLiteArgumentError',
      );
    const clonedValue = await this.#clone(defaultValue);
    if (!isNil(path)) {
      if (this.#ensureProps) await this.ensure(key, {});
      if (await this.has(key, path)) return await this.get(key, path);
      await this.set(key, defaultValue, path);
      return defaultValue;
    }
    if (this.#ensureProps && isObject(await this.get(key))) {
      if (!isObject(clonedValue))
        throw new Err(
          `Default value for "${key}" in britelite "${
            this.#name
          }" must be an object when merging with an object value.`,
          'BriteLiteArgumentError',
        );
      const merged = merge(clonedValue, this.get(key));
      await this.set(key, merged);
      return merged;
    }
    if (await this.has(key)) return await this.get(key);
    await this.set(key, clonedValue);
    return clonedValue;
  }

  /* BOOLEAN METHODS THAT CHECKS FOR THINGS */

  /**
   * Returns whether or not the key exists in the BriteLite.
   * @param {string} key Required. The key of the element to add to The BriteLite or array.
   * This value MUST be a string or number.
   * @param {string} path Optional. The property to verify inside the value object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @example
   * if(britelite.has("myKey")) {
   *   // key is there
   * }
   *
   * if(!britelite.has("myOtherKey", "oneProp.otherProp.SubProp")) return false;
   * @returns {boolean}
   */
  async has(key, path = null) {
    await this.#readyCheck();
    await this.#fetchCheck(key);
    key = key.toString();
    if (!isNil(path)) {
      await this.#check(key, 'Object');
      const data = await this.get(key);
      return _has(data, path);
    }
    return super.has(key);
  }

  /**
   * Performs Array.includes() on a certain britelite value. Works similar to
   * [Array.includes()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes).
   * @param {string} key Required. The key of the array to check the value of.
   * @param {string|number} val Required. The value to check whether it's in the array.
   * @param {string} path Optional. The property to access the array inside the value object or array.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @return {boolean} Whether the array contains the value.
   */
  async includes(key, val, path = null) {
    await this.#readyCheck();
    await this.#fetchCheck(key);
    await this.#check(key, ['Array', 'Object']);
    const data = await this.get(key);
    if (!isNil(path)) {
      const propValue = _get(data, path);
      if (isArray(propValue)) {
        return propValue.includes(val);
      }
      throw new Err(
        `The property "${path}" in key "${key}" is not an Array in the britelite "${
          this.#name
        }" (property was of type "${propValue && propValue.constructor.name}")`,
        'BriteLiteTypeError',
      );
    } else if (isArray(data)) {
      return data.includes(val);
    }
    throw new Err(
      `The value of key "${key}" is not an Array in the britelite "${
        this.#name
      }" (value was of type "${data && data.constructor.name}")`,
      'BriteLiteTypeError',
    );
  }

  /**
   * Deletes a key in the BriteLite.
   * @param {string} key Required. The key of the element to delete from The BriteLite.
   * @param {string} path Optional. The name of the property to remove from the object.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
   * @returns {BriteLite} The britelite.
   */
  //@ts-ignore
  async delete(key, path = null) {
    await this.#readyCheck();
    await this.#fetchCheck(key);
    key = key.toString();
    const oldValue = await this.get(key);
    if (!isNil(path)) {
      let data = await this.get(key);
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
      await this.set(key, data);
    } else {
      super.delete(key);
      if (typeof this.changedCB === 'function') {
        this.changedCB(key, oldValue, null);
      }
      await this.#db.prepare(`DELETE FROM ${this.#name} WHERE key = ?`).bind(key).run();
      return this;
    }
    return this;
  }

  /**
   * Deletes everything from the britelite. If persistent, clears the database of all its data for this table.
   * @returns {void}
   */
  async clear() {
    await this.#readyCheck();
    await this.#db.prepare(`DELETE FROM ${this.#name};`).run();
    super.clear();
  }

  /**
   * Completely destroys the entire britelite. This deletes the database tables entirely.
   * It will not affect other britelite data in the same database, however.
   * THIS ACTION WILL DESTROY YOUR DATA AND CANNOT BE UNDONE.
   * @returns {null}
   */
  async destroy() {
    await this.clear();

    this.#isDestroyed = true;

    await this.#db.batch([
      this.#db.prepare(`DROP TABLE IF EXISTS ${this.#name};`).run(),
      this.#db.prepare(`DROP TABLE IF EXISTS 'internal::changes::${this.#name}';`).run(),
      this.#db.prepare(`DELETE FROM 'internal::autonum' WHERE britelite = '${this.#name}';`).run(),
    ]);

    return null;
  }

  /**
   * Remove a value in an Array or Object element in BriteLite. Note that this only works for
   * values, not keys. Note that only one value is removed, no more. Arrays of objects must use a function to remove,
   * as full object matching is not supported.
   * @param {string} key Required. The key of the element to remove from in BriteLite.
   * This value MUST be a string or number.
   * @param {*|Function} val Required. The value to remove from the array or object. OR a function to match an object.
   * If using a function, the function provides the object value and must return a boolean that's true for the object you want to remove.
   * @param {string} path Optional. The name of the array property to remove from.
   * Can be a path with dot notation, such as "prop1.subprop2.subprop3".
   * If not presents, removes directly from the value.
   * @example
   * // Assuming
   * britelite.set('array', [1, 2, 3])
   * britelite.set('objectarray', [{ a: 1, b: 2, c: 3 }, { d: 4, e: 5, f: 6 }])
   *
   * britelite.remove('array', 1); // value is now [2, 3]
   * britelite.remove('objectarray', (value) => value.e === 5); // value is now [{ a: 1, b: 2, c: 3 }]
   * @returns {BriteLite} The britelite.
   */
  async remove(key, val, path = null) {
    await this.#readyCheck();
    await this.#fetchCheck(key);
    await this.#check(key, ['Array', 'Object']);
    const data = await this.get(key, path);
    const criteria = isFunction(val) ? val : (value) => val === value;
    const index = data.findIndex(criteria);
    if (index > -1) {
      data.splice(index, 1);
    }
    return this.set(key, data, path);
  }

  /**
   * Exports the britelite data to stringified JSON format.
   * **__WARNING__**: Does not work on memory britelites containing complex data!
   * @returns {string} The britelite data in a stringified JSON format.
   */
  async export() {
    await this.#readyCheck();
    await this.fetchEverything();
    return JSON.stringify(
      {
        name: this.#name,
        version: '1.0.0',
        exportDate: Date.now(),
        keys: await this.map((value, key) => ({ key, value })),
      },
    );
  }

  /**
   * Import an existing json export from britelite from a string. This data must have been exported from britelite,
   * and must be from a version that's equivalent or lower than where you're importing it.
   * @param {string} data The data to import to BriteLite. Must contain all the required fields provided by export()
   * @param {boolean} overwrite Defaults to `true`. Whether to overwrite existing key/value data with incoming imported data
   * @param {boolean} clear Defaults to `false`. Whether to clear the britelite of all data before importing
   * (**__WARNING__**: Any existing data will be lost! This cannot be undone.)
   * @returns {BriteLite} The britelite with the new data.
   */
  async import(data, overwrite = true, clear = false) {
    await this.#readyCheck();
    if (clear) await this.clear();
    if (isNil(data))
      throw new Err(
        `No data provided for import() in "${this.#name}"`,
        'BriteLiteImportError',
      );
    try {
      const parsed = JSON.parse(data);
      for (const thisEntry of parsed.keys) {
        const { key, value } = thisEntry;
        if (!overwrite && this.has(key)) continue;
        await this.#internalSet(key, await this.#deserializer(value, key));
      }
    } catch (err) {
      throw new Err(
        `Data provided for import() in "${
          this.#name
        }" is invalid JSON. Stacktrace:\n${err}`,
        'BriteLiteImportError',
      );
    }
    return this;
  }

  /**
   * Initialize multiple BriteLites easily.
   * @param {Array<string>} names Array of strings. Each array entry will create a separate britelite with that name.
   * @param {Object} options Options object to pass to each britelite, excluding the name..
   * @example
   * // Using local variables.
   * const BriteLite = require('britelite');
   * const { settings, tags, blacklist } = BriteLite.multi(['settings', 'tags', 'blacklist']);
   *
   * // Attaching to an existing object (for instance some API's client)
   * const BriteLite = require("britelite");
   * Object.assign(client, BriteLite.multi(["settings", "tags", "blacklist"]));
   *
   * @returns {Object} An array of initialized BriteLites.
   */
  static multi(names, options = {}) {
    if (!names.length || names.length < 1) {
      throw new Err(
        '"names" argument must be an array of string names.',
        'BriteLiteTypeError',
      );
    }

    const returnvalue = {};
    for (const name of names) {
      const britelite = new BriteLite({ name, ...options });
      returnvalue[name] = britelite;
    }
    return returnvalue;
  }

  /* INTERNAL (Private) METHODS */

  /*
   * Internal Method. Initializes the britelite depending on given values.
   * @param {Map} database In order to set data to the BriteLite, one must be provided.
   */
  async #init() {
    const count = await this.#db
      .prepare(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name = ?;",
      )
      .bind(this.#name)
      .first('count');
    if (!count) {
      await this.#db
        .prepare(
          `CREATE TABLE ${this.#name} (key text PRIMARY KEY, value text)`,
        )
        .run().catch(console.error);
      await this.#db
        .prepare(
          `CREATE TABLE IF NOT EXISTS 'internal::changes::${
            this.#name
          }' (type TEXT, key TEXT, value TEXT, timestamp INTEGER, pid INTEGER);`,
        )
        .run();
      await this.#db
        .prepare(
          `CREATE TABLE IF NOT EXISTS 'internal::autonum' (britelite TEXT PRIMARY KEY, lastnum INTEGER)`,
        )
        .run();
    }
    if (this.#fetchAll) {
      await this.fetchEverything();
    }
    resolveDefer('dbready');
  }

  /*
   * INTERNAL method to verify the type of a key or property
   * Will THROW AN ERROR on wrong type, to simplify code.
   * @param {string} key Required. The key of the element to check
   * @param {string} type Required. The javascript constructor to check
   * @param {string} path Optional. The dotProp path to the property in the object britelite.
   */
  async #check(key, type, path = null) {
    key = key.toString();
    if (!await this.has(key))
      throw new Err(
        `The key "${key}" does not exist in the britelite "${this.#name}"`,
        'BriteLiteTypeError',
      );
    if (!type) return;
    if (!isArray(type)) type = [type];
    if (!isNil(path)) {
      await this.#check(key, 'Object');
      const data = await this.get(key);
      if (isNil(_get(data, path))) {
        throw new Err(
          `The property "${path}" in key "${key}" does not exist. Please set() it or ensure() it."`,
          'BriteLiteTypeError',
        );
      }
      if (!type.includes(_get(data, path).constructor.name)) {
        throw new Err(
          `The property "${path}" in key "${key}" is not of type "${type.join(
            '" or "',
          )}" in the britelite "${this.#name}" 
(key was of type "${_get(data, path).constructor.name}")`,
          'BriteLiteTypeError',
        );
      }
    } else if (!type.includes(await this.get(key).constructor.name)) {
      throw new Err(
        `The value for key "${key}" is not of type "${type.join(
          '" or "',
        )}" in the britelite "${this.#name}" (value was of type "${
          await this.get(key).constructor.name
        }")`,
        'BriteLiteTypeError',
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
        'BriteLiteTypeError',
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
   * Internal method used to validate persistent britelite names (valid Windows filenames)
   */
  #validateName() {
    this.#name = this.#name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  /*
   * Internal Method. Verifies if a key needs to be fetched from the database.
   * If persistent britelite and autoFetch is on, retrieves the key.
   * @param {string} key The key to check or fetch.
   */
  async #fetchCheck(key, force = false) {
    key = key.toString();
    if (!['String', 'Number'].includes(key.constructor.name)) return;
    if (force) {
      await this.fetch(key);
      return;
    }
    if (super.has(key)) return;
    if (!this.#autoFetch) return;
    await this.fetch(key);
  }

  /*
   * Internal Method. Parses JSON data.
   * Reserved for future use (logical checking)
   * @param {*} data The data to check/parse
   * @returns {*} An object or the original data.
   */
  #parseData(data, key) {
    return this.#deserializer(JSON.parse(data), key);
  }

  /*
   * Internal Method. Clones a value or object with the britelite's set clone level.
   * @param {*} data The data to clone.
   * @return {*} The cloned value.
   */
  #clone(data) {
    if (this.#cloneLevel === 'none') return data;
    if (this.#cloneLevel === 'shallow') return clone(data);
    if (this.#cloneLevel === 'deep') return cloneDeep(data);
    throw new Err(
      "Invalid cloneLevel. What did you *do*, this shouldn't happen!",
      'BriteLiteOptionsError',
    );
  }

  /*
   * Internal Method. Verifies that the database is ready, assuming persistence is used.
   */
  #readyCheck() {
    if (this.#isDestroyed)
      throw new Err(
        'This britelite has been destroyed and can no longer be used without being re-initialized.',
        'BriteLiteDestroyedError',
      );
  }

  /*
   * Internal Method. Sets data without looking at cache, fetching, or anything else. Used when fetch/ready checks are already made.
   */
  async #internalSet(key, value, updateCache = true) {
    let serialized;
    try {
      serialized = JSON.stringify(await this.#serializer(value, key));
    } catch (e) {
      serialized = JSON.stringify(await this.#serializer(onChange.target(value), key));
    }
    await this.#db
      .prepare(
        `INSERT OR REPLACE INTO ${this.#name} (key, value) VALUES (?, ?);`,
      )
      .bind(key, serialized)
      .run();
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
   * Obtains random value(s) from this BriteLite. This relies on {@link BriteLite#array}.
   * @param {number} [count] Number of values to obtain randomly
   * @returns {*|Array<*>} The single value if `count` is undefined,
   * or an array of values of `count` length
   */
  // TODO: This shit shouldn't be loading the entirety of values. Use SQL properly for god's sake!
  async random(count) {
    let arr = await this.values();
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
   * Obtains random key(s) from this BriteLite. This relies on {@link BriteLite#keyArray}
   * @param {number} [count] Number of keys to obtain randomly
   * @returns {*|Array<*>} The single key if `count` is undefined,
   * or an array of keys of `count` length
   */
  async randomKey(count) {
    let arr = await this.keys();
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
   * britelite.findAll('username', 'Bob');
   */
  async findAll(prop, value) {
    if (typeof prop !== 'string') throw new TypeError('Key must be a string.');
    if (isNil(value)) throw new Error('Value must be specified.');
    const results = [];
    for (const item of await this.values()) {
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
   * <warn>All BriteLite used in Discord.js are mapped using their `id` property, and if you want to find by id you
   * should use the `get` method. See
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get) for details.</warn>
   * @param {string|Function} propOrFn The property to test against, or the function to test with
   * @param {*} [value] The expected value - only applicable and required if using a property for the first argument
   * @returns {*}
   * @example
   * britelite.find('username', 'Bob');
   * @example
   * britelite.find(val => val.username === 'Bob');
   */
  async find(propOrFn, value) {
    await this.#readyCheck();
    if (isNil(propOrFn) || (!isFunction(propOrFn) && isNil(value))) {
      throw new Err(
        'find requires either a prop and value, or a function. One of the provided arguments was null or undefined',
        'BriteLiteArgumentError',
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
   * britelite.findKey('username', 'Bob');
   * @example
   * britelite.findKey(val => val.username === 'Bob');
   */
  async findKey(propOrFn, value) {
    await this.#readyCheck();
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
  async sweep(fn, thisArg) {
    await this.#readyCheck();
    if (thisArg) fn = fn.bind(thisArg);
    const previousSize = await this.size;
    for (const [key, val] of this) {
      if (fn(val, key, this)) await this.delete(key);
    }
    return previousSize - await this.size;
  }

  /**
   * Identical to
   * [Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
   * @param {Function} fn Function used to test (should return a boolean)
   * @param {Object} [thisArg] Value to use as `this` when executing function
   * @returns {BriteLite}
   */
  async filter(fn, thisArg) {
    await this.#readyCheck();
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
  async map(fn, thisArg) {
    await this.#readyCheck();
    if (thisArg) fn = fn.bind(thisArg);
    const arr = new Array(await this.size);
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
  async some(fn, thisArg) {
    await this.#readyCheck();
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
  async every(fn, thisArg) {
    await this.#readyCheck();
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
   * and `britelite`
   * @param {*} [initialValue] Starting value for the accumulator
   * @returns {*}
   */
  async reduce(fn, initialValue) {
    await this.#readyCheck();
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
}

export default BriteLite;

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
