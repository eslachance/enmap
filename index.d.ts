declare module 'enmap' {
    /**
     * A enhanced Map structure with additional utility methods.
     * Can be made persistent
     * @extends {Map}
     */
    export = Enmap;

    type PropOrFun = (val: any, key: string | number, thisArg: Enmap) => any;
    type filterFunc = (val: any, key: string | number, thisArg: Enmap) => boolean;
    type someFunc = (val: any, key: string | number, thisArg: Enmap) => boolean;
    type everyFunc = (val: any, key: string | number, thisArg: Enmap) => boolean;
    type mapFunc = (val: any, key: string | number, thisArg: Enmap) => any;
    type reduceFunc = (
        accumulator: any,
        currentValue: any,
        currentKey: string | number,
        thisArg: Enmap
    ) => any;

    class Enmap extends Map {
        /**
         * Initialize multiple Enmaps easily.
         * @param {Array<string>} names Array of strings. Each array entry will create a separate enmap with that name.
         * @param {EnmapProvider} Provider Valid EnmapProvider object.
         * @param {Object} options Options object to pass to the provider. See provider documentation for its options.
         * @returns {Array<Map>} An array of initialized Enmaps.
         */
        public static multi(names: string[], Provider: any, options?: any): Enmap[];

        public fetchAll: boolean;

        private db: object;
        private defer: boolean;
        private persistent: boolean;

        constructor(iterable?: Iterable<any> | { provider: any }, options?: any);

        /**
         * Shuts down the underlying persistent enmap database.
         */
        public close(): void;

        /**
         * Retrieves a key from the enmap. If fetchAll is false, returns a promise.
         * @param {string|number} key The key to retrieve from the enmap.
         * @return {*|Promise<*>} The value or a promise containing the value.
         */
        public get(key: string | number): any | Promise<any>;

        /**
         * Force fetch one or more key values from the enmap. If the database has changed, that new value is used.
         * @param {string|number} keyOrKeys A single key or array of keys to force fetch from the enmap database.
         * @return {*|Map} A single value if requested, or a non-persistent enmap of keys if an array is requested.
         */
        public fetch(
            keyOrKeys: string | number | Array<string | number>
        ): any | Enmap;

        /**
         * Fetches every key from the persistent enmap and loads them into the current enmap value.
         * @return {Map} The enmap containing all values.
         */
        public fetchEverything(): this;

        /**
         * Set the value in Enmap.
         * @param {string|number} key Required. The key of the element to add to The Enmap.
         * If the Enmap is persistent this value MUST be a string or number.
         * @param {*} val Required. The value of the element to add to The Enmap.
         * If the Enmap is persistent this value MUST be stringifiable as JSON.
         * @return {Enmap} The Enmap.
         */
        public set(key: string | number, val: any): this;

        /**
         * Set the value in Enmap, but returns a promise that resolves once writte to the database.
         * Useless on non-persistent Enmaps.
         * @param {string|number} key Required. The key of the element to add to The Enmap.
         * If the Enmap is persistent this value MUST be a string or number.
         * @param {*} val Required. The value of the element to add to The Enmap.
         * If the Enmap is persistent this value MUST be stringifiable as JSON.
         * @return {Promise<Map>} The Enmap.
         */
        public setAsync(key: string | number, val: any): Promise<this>;

        /**
         * Returns the specific property within a stored value. If the value isn't an object or array,
         * returns the unchanged data If the key does not exist or the value is not an object, throws an error.
         * @param {string|number} key Required. The key of the element to get from The Enmap.
         * @param {*} prop Required. The property to retrieve from the object or array.
         * @return {*} The value of the property obtained.
         */
        public getProp(key: string | number, prop: any): any;

        /**
         * Modify the property of a value inside the enmap, if the value is an object or array.
         * This is a shortcut to loading the key, changing the value, and setting it back.
         * @param {string|number} key Required. The key of the element to add to The Enmap or array.
         * This value MUST be a string or number.
         * @param {*} prop Required. The property to modify inside the value object or array.
         * @param {*} val Required. The value to apply to the specified property.
         * @param {boolean} save Optional. Whether to save to persistent DB (used as false in init)
         * @return {Map} The EnMap.
         */
        public setProp(key: string | number, prop: any, val: any): this;

        /**
         * Returns whether or not the key exists in the Enmap.
         * @param {string|number} key Required. The key of the element to add to The Enmap or array.
         * This value MUST be a string or number.
         * @returns {Promise<boolean>}
         */
        public has(key: string | number): boolean;
        public has(key: string | number): Promise<boolean>;

        /**
         * Returns whether or not the property exists within an object or array value in enmap.
         * @param {string|number} key Required. The key of the element to check in the Enmap or array.
         * @param {*} prop Required. The property to verify inside the value object or array.
         * @return {boolean} Whether the property exists.
         */
        public hasProp(key: string | number, prop: any): boolean;

        /**
         * Delete a property from an object or array value in Enmap.
         * @param {string|number} key Required. The key of the element to delete the property from in Enmap.
         * @param {*} prop Required. The name of the property to remove from the object.
         * @returns {Promise<Enmap>|Enmap} If fetchAll is true, return the Enmap. Otherwise return a promise containing
         * the Enmap.
         */
        public deleteProp(key: string | number, prop: any): Promise<this> | this;

        /**
         * Deletes a key in the Enmap.
         * @param {string|number} key Required. The key of the element to delete from The Enmap.
         * @param {boolean} bulk Internal property used by the purge method.
         */
        public delete(key: string | number): boolean;

        /**
         *
         * @param {string|number} key Required. The key of the element to delete from The Enmap.
         * @param {boolean} bulk Internal property used by the purge method.
         */
        public deleteAsync(key: string | number): boolean;

        /**
         * Creates an ordered array of the values of this Enmap, and caches it internally.
         * The array will only be reconstructed if an item is added to or removed from the Enmap,
         * or if you change the length of the array itself. If you don't want this caching behaviour,
         * use `Array.from(enmap.values())` instead.
         * @returns {Array}
         */
        public array(): any[];

        /**
         * Creates an ordered array of the keys of this Enmap, and caches it internally.
         * The array will only be reconstructed if an item is added to or removed from the Enmap,
         * or if you change the length of the array itself. If you don't want this caching behaviour,
         * use `Array.from(enmap.keys())` instead.
         * @returns {Array}
         */
        public keyArray(): any[];

        /**
         * Obtains random value(s) from this Enmap. This relies on {@link Enmap#array},
         * and thus the caching mechanism applies here as well.
         * @param {number} [count] Number of values to obtain randomly
         * @returns {*|Array<*>} The single value if `count` is undefined,
         * or an array of values of `count` length
         */
        public random(count: number): any | any[];

        /**
         * Obtains random key(s) from this Enmap. This relies on {@link Enmap#keyArray},
         * and thus the caching mechanism applies here as well.
         * @param {number} [count] Number of keys to obtain randomly
         * @returns {*|Array<*>} The single key if `count` is undefined,
         * or an array of keys of `count` length
         */
        public randomKey(count: number): any | any[];

        /**
         * Searches for all items where their specified property's value is identical to the given value
         * (`item[prop] === value`).
         * @param {string} prop The property to test against
         * @param {*} value The expected value
         * @returns {Array}
         * @example
         * enmap.findAll('username', 'Bob');
         */
        public findAll(prop: string, value: any): any[];

        /**
         * Searches for a single item where its specified property's value is identical to the given value
         * (`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is identical to
         * [Array.find()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find).
         * <warn>All Enmap used in Discord.js are mapped using their `id` property, and if you want to find by id you
         * should use the `get` method. See
         * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get)
         * for details.</warn>
         * @param {string|Function} propOrFn The property to test against, or the function to test with
         * @param {*} [value] The expected value - only applicable and required if using a property for the first argument
         * @returns {*}
         * @example
         * enmap.find('username', 'Bob');
         * @example
         * enmap.find(val => val.username === 'Bob');
         */
        public find(propOrFn: string | PropOrFun, value: any): any;

        /**
         * Searches for the key of a single item where its specified property's value is identical to the given value
         * (`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is identical to
         * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
         * @param {string|Function} propOrFn The property to test against, or the function to test with
         * @param {*} [value] The expected value - only applicable and required if using a property for the first argument
         * @returns {*}
         * @example
         * enmap.findKey('username', 'Bob');
         * @example
         * enmap.findKey(val => val.username === 'Bob');
         */
        public findKey(propOrFn: string | PropOrFun, value: any): any;

        /**
         * Searches for the existence of a single item where its specified property's value is identical to the given value
         * (`item[prop] === value`).
         * <warn>Do not use this to check for an item by its ID. Instead, use `enmap.has(id)`. See
         * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has) for details.
         * </warn>
         * @param {string} prop The property to test against
         * @param {*} value The expected value
         * @returns {boolean}
         * @example
         * if (enmap.exists('username', 'Bob')) {
   *  console.log('user here!');
   * }
         */
        public exists(prop: string, value: any): boolean;

        /**
         * Identical to
         * [Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter),
         * but returns a Enmap instead of an Array.
         * @param {Function} fn Function used to test (should return a boolean)
         * @param {Object} [thisArg] Value to use as `this` when executing function
         * @returns {Enmap}
         */
        public filter(fn: filterFunc, thisArg?: any): Enmap;

        /**
         * Identical to
         * [Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).
         * @param {Function} fn Function used to test (should return a boolean)
         * @param {Object} [thisArg] Value to use as `this` when executing function
         * @returns {Array}
         */
        public filterArray(fn: filterFunc, thisArg?: any): any[];

        /**
         * Identical to
         * [Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).
         * @param {Function} fn Function that produces an element of the new array, taking three arguments
         * @param {*} [thisArg] Value to use as `this` when executing function
         * @returns {Array}
         */
        public map(fn: mapFunc, thisArg?: any): any[];

        /**
         * Identical to
         * [Array.some()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some).
         * @param {Function} fn Function used to test (should return a boolean)
         * @param {Object} [thisArg] Value to use as `this` when executing function
         * @returns {boolean}
         */
        public some(fn: someFunc, thisArg?: any): any[];

        /**
         * Identical to
         * [Array.every()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every).
         * @param {Function} fn Function used to test (should return a boolean)
         * @param {Object} [thisArg] Value to use as `this` when executing function
         * @returns {boolean}
         */
        public every(fn: everyFunc, thisArg?: any): any[];

        /**
         * Identical to
         * [Array.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce).
         * @param {Function} fn Function used to reduce, taking four arguments; `accumulator`, `currentValue`, `currentKey`,
         * and `enmap`
         * @param {*} [initialValue] Starting value for the accumulator
         * @returns {*}
         */
        public reduce(fn: reduceFunc, initialValue: any): any[];

        /**
         * Creates an identical shallow copy of this Enmap.
         * @returns {Enmap}
         * @example const newColl = someColl.clone();
         */
        public clone(): Enmap;

        /**
         * Combines this Enmap with others into a new Enmap. None of the source Enmaps are modified.
         * @param {...Enmap} enmaps Enmaps to merge
         * @returns {Enmap}
         * @example const newColl = someColl.concat(someOtherColl, anotherColl, ohBoyAColl);
         */
        public concat(...enmaps: Enmap[]): Enmap;

        /**
         * Calls the `delete()` method on all items that have it.
         * @param {boolean} bulk Optional. Defaults to True. whether to use the provider's "bulk" delete feature
         * if it has one.
         */
        public deleteAll(bulk: boolean): void;

        /**
         * Calls the `delete()` method on all items that have it.
         * @param {boolean} bulk Optional. Defaults to True. whether to use the provider's "bulk" delete feature
         * if it has one.
         * @return {Promise} Returns a promise that is resolved when the database is cleared.
         */
        public deleteAllAsync(bulk: boolean): Promise<any>;

        /**
         * Checks if this Enmap shares identical key-value pairings with another.
         * This is different to checking for equality using equal-signs, because
         * the Enmaps may be different objects, but contain the same data.
         * @param {Enmap} enmap Enmap to compare with
         * @returns {boolean} Whether the Enmaps have identical contents
         */
        public equals(enmap: Enmap): boolean;
    }
}
