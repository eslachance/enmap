/**
 * A enhanced Map structure with additional utility methods.
 * Can be made persistent 
 * @extends {Map}
 */
class Enmap extends Map {

  constructor(iterable, options = {}) {
    if (!iterable || typeof iterable[Symbol.iterator] !== 'function') {
      options = iterable || {};
      iterable = null;
    }
    super(iterable);

    this.fetchAll = options.fetchAll !== undefined ? options.fetchAll : true;

    if (options.provider) {
      this.persistent = true;
      this.db = options.provider;
      this.db.fetchAll = this.fetchAll;
      this.defer = this.db.defer;
      this.db.init(this);
    }
  }

  static multi(names, Provider, options = {}) {
    if (!names.length || names.length < 1) {
      throw new Error('"names" parameter must be an array of string names');
    }
    if (!Provider) {
      throw new Error('Provider must be given and be an enmap provider!');
    }

    const returnvalue = {};
    for (const name of names) {
      const enmap = new Enmap({ provider: new Provider(Object.assign(options, { name })) });
      returnvalue[name] = enmap;
    }
    return returnvalue;
  }

  /**
   * Shuts down the underlying persistent enmap database.
   */
  close() {
    this.db.close();
  }

  /**
   * Retrieves a key from the enmap. If fetchAll is false, returns a promise.
   * @param {*} key The key to retrieve from the enmap.
   * @return {*|Promise<*>} The value or a promise containing the value.
   */
  get(key) {
    if (this.has(key)) {
      return super.get(key);
    }
    if (this.fetchAll) {
      return null;
    }
    return this.fetch(key);
  }

  /**
   * Fetch one or more key values from the enmap.
   * @param {*} keyOrKeys A single key or array of keys to force fetch from the enmap database.
   * @return {*|Map} A single value if requested, or a non-persistent enmap of keys if an array is requested.
   */
  async fetch(keyOrKeys) {
    if (!Array.isArray(keyOrKeys)) {
      return this.db.fetch(keyOrKeys);
    }
    return new this.constructor(await Promise.all(keyOrKeys.map(async key => {
      const value = await this.db.fetch(key);
      super.set(key, value);
      return [key, value];
    })));
  }

  /**
   * Fetches every key from the persistent enmap and loads them into the current enmap value.
   * @return {Map} The enmap containing all values.
   */
  fetchEverything() {
    return this.db.fetchEverything();
  }

  /**
   * 
   * @param {*} key Required. The key of the element to add to The Enmap. 
   * If the EnMap is persistent this value MUST be a string or number.
   * @param {*} val Required. The value of the element to add to The Enmap. 
   * If the EnMap is persistent this value MUST be stringifiable as JSON.
   * @param {boolean} save Optional. Whether to save to persistent DB (used as false in init)
   * @return {Map} The Enmap.
   */
  set(key, val) {
    if (this.persistent) {
      this.db.set(key, val);
    }
    return super.set(key, val);
  }

  /**
   * 
   * @param {*} key Required. The key of the element to add to The Enmap. 
   * If the EnMap is persistent this value MUST be a string or number.
   * @param {*} val Required. The value of the element to add to The Enmap. 
   * If the EnMap is persistent this value MUST be stringifiable as JSON.
   * @return {Map} The Enmap.
   */
  async setAsync(key, val) {
    await this.db.set(key, val);
    return super.set(key, val);
  }

  /**
   * Returns the specific property within a stored value. If the value isn't an object or array, returns the unchanged data
   * If the key does not exist or the value is not an object, throws an error.
   * @param {*} key Required. The key of the element to get from The Enmap. 
   * @param {*} prop Required. The property to retrieve from the object or array.
   * @return {*} The value of the property obtained.
   */
  getProp(key, prop) {
    if (this.fetchAll) {
      if (this.has(key)) {
        const data = super.get(key);
        return typeof data === 'object' ? data[prop] || null : data;
      } else {
        throw 'This key does not exist';
      }
    } else {
      return this.fetch(key).then(data => {
        if (!data) throw 'This key does not exist';
        return typeof data === 'object' ? data[prop] || null : data;
      });
    }
  }

  /**
   * Modify the property of a value inside the enmap, assuming this value is an object or array.
   * This is a shortcut to loading the key, changing the value, and setting it back.
   * If the key does not exist or the value is not an object, throws an error.
   * @param {*} key Required. The key of the element to add to The Enmap or array. 
   * If the EnMap is persistent this value MUST be a string or number.
   * @param {*} prop Required. The property to modify inside the value object or array.
   * @param {*} val Required. The value to apply to the specified property.
   * @param {boolean} save Optional. Whether to save to persistent DB (used as false in init)
   * @return {Map} The EnMap.
   */
  setProp(key, prop, val) {
    if (!this.has(key)) {
      throw 'This key does not exist';
    }
    const data = super.get(key);
    if (typeof data !== 'object') {
      throw 'Method can only be used when the value is an object';
    }
    data[prop] = val;
    if (this.persistent) {
      this.db.set(key, data);
    }
    return super.set(key, data);
  }

  has(key) {
    if (this.fetchAll) return super.has(key);
    return this.db.hasAsync(key);
  }

  /**
   * Returns whether or not the property exists within an object or array value in enmap.
   * If the key does not exist or the value is not an object, throws an error.
   * @param {*} key Required. The key of the element to check in the Enmap or array. 
   * @param {*} prop Required. The property to verify inside the value object or array.
   * @return {boolean} Whether the property exists.
   */
  hasProp(key, prop) {
    if (this.fetchAll) {
      if (!this.has(key)) {
        throw 'This key does not exist';
      }
      const data = super.get(key);
      if (typeof data !== 'object') {
        throw 'The value of this key is not an object.';
      }
      return data.hasOwnProperty(prop);
    } else {
      return this.fetch(key).then(data => {
        if (!data) throw 'This key does not exist';
        if (typeof data !== 'object') {
          throw 'The value of this key is not an object.';
        }
        return data.hasOwnProperty(prop);
      });
    }
  }

  /**
   * 
   * @param {*} key Required. The key of the element to delete from The Enmap. 
   * @param {boolean} bulk Internal property used by the purge method.  
   */
  delete(key) {
    if (this.persistent) {
      this.db.delete(key);
    }
    super.delete(key);
  }

  /**
   * 
   * @param {*} key Required. The key of the element to delete from The Enmap. 
   * @param {boolean} bulk Internal property used by the purge method.  
   */
  async deleteAsync(key) {
    await this.db.delete(key);
    super.delete(key);
  }

  /**
   * Creates an ordered array of the values of this Enmap, and caches it internally.
   * The array will only be reconstructed if an item is added to or removed from the Enmap,
   * or if you change the length of the array itself. If you don't want this caching behaviour, 
   * use `Array.from(enmap.values())` instead.
   * @returns {Array}
   */
  array() {
    return Array.from(this.values());
  }

  /**
     * Creates an ordered array of the keys of this Enmap, and caches it internally.
     * The array will only be reconstructed if an item is added to or removed from the Enmap, 
     * or if you change the length of the array itself. If you don't want this caching behaviour, 
     * use `Array.from(enmap.keys())` instead.
     * @returns {Array}
     */
  keyArray() {
    return Array.from(this.keys());
  }

  /**
     * Obtains random value(s) from this Enmap. This relies on {@link Enmap#array}, 
     * and thus the caching mechanism applies here as well.
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
    for (let i = 0; i < count; i++) {
      rand[i] = [arr.splice(Math.floor(Math.random() * arr.length), 1)];
    }
    return rand;
  }

  /**
     * Obtains random key(s) from this Enmap. This relies on {@link Enmap#keyArray}, 
     * and thus the caching mechanism applies here as well.
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
    for (let i = 0; i < count; i++) {
      rand[i] = [arr.splice(Math.floor(Math.random() * arr.length), 1)];
    }
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
    if (typeof value === 'undefined') throw new Error('Value must be specified.');
    const results = [];
    for (const item of this.values()) {
      if (item[prop] === value) results.push(item);
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
      if (typeof value === 'undefined') throw new Error('Value must be specified.');
      for (const item of this.values()) {
        if (item[propOrFn] === value) return item;
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

  /* eslint-disable max-len */
  /**
     * Searches for the key of a single item where its specified property's value is identical to the given value
     * (`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is identical to
     * [Array.findIndex()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex).
     * @param {string|Function} propOrFn The property to test against, or the function to test with
     * @param {*} [value] The expected value - only applicable and required if using a property for the first argument
     * @returns {*}
     * @example
     * enmap.findKey('username', 'Bob');
     * @example
     * enmap.findKey(val => val.username === 'Bob');
     */
  /* eslint-enable max-len */
  findKey(propOrFn, value) {
    if (typeof propOrFn === 'string') {
      if (typeof value === 'undefined') throw new Error('Value must be specified.');
      for (const [key, val] of this) {
        if (val[propOrFn] === value) return key;
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
     * Identical to
     * [Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter),
     * but returns a Enmap instead of an Array.
     * @param {Function} fn Function used to test (should return a boolean)
     * @param {Object} [thisArg] Value to use as `this` when executing function
     * @returns {Enmap}
     */
  filter(fn, thisArg) {
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
     * Calls the `delete()` method on all items that have it.
     * @param {boolean} bulk Optional. Defaults to True. whether to use the provider's "bulk" delete feature if it has one.
     */
  deleteAll(bulk = true) {
    if (this.persistent) {
      if (bulk) {
        this.db.bulkDelete();
      } else {
        for (const key of this.keys()) {
          this.db.delete(key);
        }
      }
    }
    this.clear();
  }

  /**
     * Calls the `delete()` method on all items that have it.
     * @param {boolean} bulk Optional. Defaults to True. whether to use the provider's "bulk" delete feature if it has one.
     */
  async deleteAllAsync(bulk = true) {
    if (bulk) {
      await this.db.bulkDelete();
    } else {
      const promises = [];
      for (const key of this.keys()) {
        promises.push(this.db.delete(key));
      }
      await Promise.all(promises);
    }
    this.clear();
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
