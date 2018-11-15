declare module 'enmap' {
    /**
     * A enhanced Map structure with additional utility methods.
     * Can be made persistent
     * @extends {Map}
     */
    export = Enmap;

    type key = string | number;
    type keyOrKeys = key | key[];

    type ValKeyEnmapFunc = (val: any, key: key, enamp: Enmap) => boolean;
    type findFunc = ValKeyEnmapFunc;
    type findKeyFunc = ValKeyEnmapFunc;
    type sweepFunc = ValKeyEnmapFunc;
    type partitionFunc = ValKeyEnmapFunc;
    type filterFunc = ValKeyEnmapFunc;
    type someFunc = ValKeyEnmapFunc;
    type everyFunc = ValKeyEnmapFunc;

    type mapFunc = (val: any, key: key, enamp: Enmap) => any;
    type changedFunc = (key: key, oldValue: any, newValue: any) => void;
    type reduceFunc = (
        accumulator: any,
        currentValue: any,
        currentKey: key,
        enmap: Enmap
    ) => any;

    type EnmapOptions = {
        name?: string,
        fetchAll?: boolean,
        autoFetch?: boolean,
        dataDir?: string,
        cloneLevel?: 'none' | 'shallow' | 'deep',
        polling?: boolean,
        pollingInterval?: number
    }

    type MathOps =  'add'   | 'addition'    | '+' |
                    'sub'   | 'subtract'    | '-' |
                    'mult'  | 'multiply'    | '*' |
                    'div'   | 'divide'      | '/' |
                    'exp'   | 'exponent'    | '^' |
                    'mod'   | 'modulo'      | '%' ;

    class Enmap extends Map {
        public readonly cloneLevel: 'none' | 'shallow' | 'deep';
        public readonly name: string;
        public readonly dataDir: string;
        public readonly fetchAll: boolean;
        public readonly autoFetch: boolean;
        public readonly defer: Promise<void>;
        public readonly persistent: boolean;
        public readonly pollingInterval: number;
        public readonly polling: boolean;
        public readonly isReady: boolean;
        public readonly lastSync: Date;
        public readonly changedCB: changedFunc;

        private db: any;
        private pool: any;
        private ready: () => void;

        /**
         * Retrieves the number of rows in the database for this enmap, even if they aren't fetched.
         * @return {integer} The number of rows in the database.
         */
        public readonly count: number;

        /**
         * Retrieves all the indexes (keys) in the database for this enmap, even if they aren't fetched.
         * @return {array<string>} Array of all indexes (keys) in the enmap, cached or not.
         */
        public readonly indexes: string[];

        /**
         * Generates an automatic numerical key for inserting a new value.
         * This is a "weak" method, it ensures the value isn't duplicated, but does not
         * guarantee it's sequential (if a value is deleted, another can take its place).
         * Useful for logging, but not much else.
         * @example
         * enmap.set(enmap.autonum(), "This is a new value");
         * @return {number} The generated key number.
         */
        public readonly autonum: number;

        constructor(iterable?: Iterable<any> | EnmapOptions, options?: EnmapOptions);

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
        public set(key: key, val: any, path?: string): this;

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
        public get(key: key, path?: string): any;

        /**
         * Fetches every key from the persistent enmap and loads them into the current enmap value.
         * @return {Enmap} The enmap containing all values.
         */
        public fetchEverything(): this;

        /**
         * Force fetch one or more key values from the enmap. If the database has changed, that new value is used.
         * @param {string|number|Array<string|number>} keyOrKeys A single key or array of keys to force fetch from the enmap database.
         * @return {Enmap|*} The Enmap, including the new fetched values, or the value in case the function argument is a single key.
         */
        public fetch(keyOrKeys: keyOrKeys): this | any;

        /**
         * Removes a key or keys from the cache - useful when disabling autoFetch.
         * @param {string|number|Array<string|number>} keyOrArrayOfKeys A single key or array of keys to remove from the cache.
         * @returns {Enmap} The enmap minus the evicted keys.
         */
        public evict(keyOrArrayOfKeys: keyOrKeys): this;

        /**
         * Function called whenever data changes within Enmap after the initial load.
         * Can be used to detect if another part of your code changed a value in enmap and react on it.
         * @example
         * enmap.changed((keyName, oldValue, newValue) => {
         *   console.log(`Value of ${keyName} has changed from: \n${oldValue}\nto\n${newValue});
         * });
         * @param {Function} cb A callback function that will be called whenever data changes in the enmap.
         */
        public changed(cb: changedFunc): void;

        /**
         * Shuts down the database. WARNING: USING THIS MAKES THE ENMAP UNUSEABLE. You should
         * only use this method if you are closing your entire application.
         * Note that honestly I've never had to use this, shutting down the app without a close() is fine.
         * @return {Promise<*>} The promise of the database closing operation.
         */
        public close(): Promise<void>;

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
        public setProp(key: key, path: string, val: any): this;

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
        public push(key: key, val: any, path?: string, allowDupes?: boolean): this;

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
        public pushIn(key: key, path: string, val: any, allowDupes?: boolean): this;

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
        public math(key: key, operation: MathOps, operand: number, path?: string): this;

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
        public inc(key: key, path?: string): this;

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
        public dec(key: key, path?: string): this;

        /**
         * Returns the specific property within a stored value. If the key does not exist or the value is not an object, throws an error.
         * @param {string|number} key Required. The key of the element to get from The Enmap.
         * @param {string} path Required. The property to retrieve from the object or array.
         * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
         * @return {*} The value of the property obtained.
         */
        public getProp(key: key, path: string): any;

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
        public ensure(key: key, defaultValue: any, path?: string): any;

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
        public has(key: key, path?: string): boolean;

        /**
         * Returns whether or not the property exists within an object or array value in enmap.
         * @param {string|number} key Required. The key of the element to check in the Enmap or array.
         * @param {*} path Required. The property to verify inside the value object or array.
         * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
         * @return {boolean} Whether the property exists.
         */
        public hasProp(key: key, path: string): boolean;

        /**
         * Deletes a key in the Enmap.
         * @param {string|number} key Required. The key of the element to delete from The Enmap.
         * @param {string} path Optional. The name of the property to remove from the object.
         * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
         * @returns {Enmap} The enmap.
         */
        public delete(key: key, path?: string): this;

        /**
         * Delete a property from an object or array value in Enmap.
         * @param {string|number} key Required. The key of the element to delete the property from in Enmap.
         * @param {string} path Required. The name of the property to remove from the object.
         * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
         */
        public deleteProp(key: key, path: string): void;

        /**
         * Deletes everything from the enmap. If persistent, clears the database of all its data for this table.
         */
        public deleteAll(): void;

        public clear(): void;

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
        public remove(key: key, val: any, path?: string): this;

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
        public removeFrom(key: key, path: string, val): this;

        /**
         * Initialize multiple Enmaps easily.
         * @param {Array<string>} names Array of strings. Each array entry will create a separate enmap with that name.
         * @param {Object} options Options object to pass to the provider. See provider documentation for its options.
         * @example
         * // Using local variables and the mongodb provider.
         * const Enmap = require('enmap');
         * const { settings, tags, blacklist } = Enmap.multi(['settings', 'tags', 'blacklist']);
         *
         * // Attaching to an existing object (for instance some API's client)
         * const Enmap = require("enmap");
         * Object.assign(client, Enmap.multi(["settings", "tags", "blacklist"]));
         *
         * @returns {Array<Map>} An array of initialized Enmaps.
         */
        public static multi(names: string[], options?: EnmapOptions): Enmap[];

        /* INTERNAL (Private) METHODS */

        /*
        * Internal Method. Initializes the enmap depending on given values.
        * @param {Map} pool In order to set data to the Enmap, one must be provided.
        * @returns {Promise} Returns the defer promise to await the ready state.
        */
        private _init(pool: any): Promise<void>;

        /*
        * INTERNAL method to verify the type of a key or property
        * Will THROW AN ERROR on wrong type, to simplify code.
        * @param {string|number} key Required. The key of the element to check
        * @param {string} type Required. The javascript constructor to check
        * @param {string} path Optional. The dotProp path to the property in the object enmap.
        */
        private _check(key: key, type: string, path?: string): void;

        /*
        * INTERNAL method to execute a mathematical operation. Cuz... javascript.
        * And I didn't want to import mathjs!
        * @param {number} base the lefthand operand.
        * @param {string} op the operation.
        * @param {number} opand the righthand operand.
        * @return {number} the result.
        */
        private _mathop(base: number, op: string, opand: number): number;

        /**
         * Internal method used to validate persistent enmap names (valid Windows filenames)
         * @private
         */
        private _validateName(): void;

        /*
        * Internal Method. Verifies if a key needs to be fetched from the database.
        * If persistent enmap and autoFetch is on, retrieves the key.
        * @param {string|number} key The key to check or fetch.
        */
        private _fetchCheck(key: key, force?: boolean): void;

        /*
        * Internal Method. Parses JSON data.
        * Reserved for future use (logical checking)
        * @param {*} data The data to check/parse
        * @returns {*} An object or the original data.
        */
        private _parseData(data: any): any;

        /*
        * Internal Method. Clones a value or object with the enmap's set clone level.
        * @param {*} data The data to clone.
        * @return {*} The cloned value.
        */
        private _clone(data: any): any;

        /*
        * Internal Method. Verifies that the database is ready, assuming persistence is used.
        */
        private _readyCheck(): void;

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
        public array(): any[];

        /**
         * Creates an ordered array of the keys of this Enmap
         * The array will only be reconstructed if an item is added to or removed from the Enmap,
         * or if you change the length of the array itself. If you don't want this caching behaviour,
         * use `Array.from(enmap.keys())` instead.
         * @returns {Array<string | number>}
         */
        public keyArray(): key[];

        /**
         * Obtains random value(s) from this Enmap. This relies on {@link Enmap#array}.
         * @param {number} [count] Number of values to obtain randomly
         * @returns {*|Array<*>} The single value if `count` is undefined,
         * or an array of values of `count` length
         */
        public random(count?: number): any | any[];

        /**
         * Obtains random key(s) from this Enmap. This relies on {@link Enmap#keyArray}
         * @param {number} [count] Number of keys to obtain randomly
         * @returns {*|Array<*>} The single key if `count` is undefined,
         * or an array of keys of `count` length
         */
        public randomKey(count?: number): any | any[];

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
         * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get) for details.</warn>
         * @param {string|Function} propOrFn The property to test against, or the function to test with
         * @param {*} [value] The expected value - only applicable and required if using a property for the first argument
         * @returns {*}
         * @example
         * enmap.find('username', 'Bob');
         * @example
         * enmap.find(val => val.username === 'Bob');
         */
        public find(propOrFn: string | findFunc, value?: any): any;

        /* eslint-disable max-len */
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
        /* eslint-enable max-len */
        public findKey(propOrFn: string | findKeyFunc, value?: any): key;

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
        public exists(prop: string, value: any): boolean;

        /**
         * Removes entries that satisfy the provided filter function.
         * @param {Function} fn Function used to test (should return a boolean)
         * @param {Object} [thisArg] Value to use as `this` when executing function
         * @returns {number} The number of removed entries
         */
        public sweep(fn: sweepFunc, thisArg?: any): number;

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
         * Partitions the collection into two collections where the first collection
         * contains the items that passed and the second contains the items that failed.
         * @param {Function} fn Function used to test (should return a boolean)
         * @param {*} [thisArg] Value to use as `this` when executing function
         * @returns {Collection[]}
         * @example const [big, small] = collection.partition(guild => guild.memberCount > 250);
         */
        public partition(fn: partitionFunc, thisArg?: any): [Enmap, Enmap];

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
        public some(fn: someFunc, thisArg?: any): boolean;

        /**
         * Identical to
         * [Array.every()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every).
         * @param {Function} fn Function used to test (should return a boolean)
         * @param {Object} [thisArg] Value to use as `this` when executing function
         * @returns {boolean}
         */
        public every(fn: everyFunc, thisArg?: any): boolean;

        /**
         * Identical to
         * [Array.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce).
         * @param {Function} fn Function used to reduce, taking four arguments; `accumulator`, `currentValue`, `currentKey`,
         * and `enmap`
         * @param {*} [initialValue] Starting value for the accumulator
         * @returns {*}
         */
        public reduce(fn: reduceFunc, initialValue: any): any;

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
         * Checks if this Enmap shares identical key-value pairings with another.
         * This is different to checking for equality using equal-signs, because
         * the Enmaps may be different objects, but contain the same data.
         * @param {Enmap} enmap Enmap to compare with
         * @returns {boolean} Whether the Enmaps have identical contents
         */
        public equals(enmap: Enmap): boolean;
    }
}
