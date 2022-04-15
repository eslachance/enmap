declare module 'enmap' {
  export interface EnmapOptions {
    name?: string;
    fetchAll?: boolean;
    autoFetch?: boolean;
    dataDir?: string;
    cloneLevel?: 'none' | 'shallow' | 'deep';
    polling?: boolean;
    pollingInterval?: number;
    ensureProps?: boolean;
    wal?: boolean;
    verbose?: (query: string) => void;
    autoEnsure?: unknown;
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
    | '%';

  /*
   * see https://github.com/eslachance/enmap/issues/54
   */
  type Path<T, Key extends keyof T = keyof T> = Key extends string
    ? T[Key] extends Record<string, any>
      ?
          | `${Key}.${Path<T[Key], Exclude<keyof T[Key], keyof any[]>> &
              string}`
          | `${Key}.${Exclude<keyof T[Key], keyof any[]> & string}`
          | Key
      : never
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
   * Hack to work around TypeScript's structural integrity requirement.
   * This is the Map<K, V> class without the delete method since Enmap returns this
   * while the standard returns boolean.
   */
  class AlmostMap<K, V> {
    readonly size: number;
    readonly [Symbol.toStringTag]: 'Map';

    clear(): void;
    forEach(
      callbackfn: (value: V, key: K, map: Map<K, V>) => void,
      thisArg?: any,
    ): void;

    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value: V): this;

    entries(): IterableIterator<[K, V]>;
    keys(): IterableIterator<K>;
    values(): IterableIterator<V>;

    [Symbol.iterator](): IterableIterator<[K, V]>;
  }

  /**
   * A enhanced Map structure with additional utility methods.
   * Can be made persistent
   */
  export default class Enmap<
    K extends string | number = string | number,
    V = any,
  > extends AlmostMap<K, V> {
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
    public readonly ensureProps: boolean;
    public readonly wal: boolean;
    public readonly changedCB: (
      key: K,
      oldValue: V | undefined,
      newValue: V | undefined,
    ) => void;

    private db: any;
    private pool: any;
    private ready: () => void;

    /**
     * Retrieves the number of rows in the database for this enmap, even if they aren't fetched.
     * @return The number of rows in the database.
     */
    public readonly count: number;

    /**
     * Retrieves all the indexes (keys) in the database for this enmap, even if they aren't fetched.
     * @return Array of all indexes (keys) in the enmap, cached or not.
     */
    public readonly indexes: string[];

    /**
     * Generates an automatic numerical key for inserting a new value.
     * This is a "weak" method, it ensures the value isn't duplicated, but does not
     * guarantee it's sequential (if a value is deleted, another can take its place).
     * Useful for logging, but not much else.
     * @example
     * enmap.set(enmap.autonum, "This is a new value");
     * @return The generated key number.
     */
    public readonly autonum: number;

    /**
     * Initializes a new Enmap, with options.
     * @param iterable If iterable data, only valid in non-persistent enmaps.
     * If this parameter is a string, it is assumed to be the enmap's name, which is a shorthand for adding a name in the options
     * and making the enmap persistent.
     * @param options Additional options for the enmap. See https://enmap.evie.codes/usage#enmap-options for details.
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
    constructor(
      iterable?: Iterable<[K, V]> | string | EnmapOptions,
      options?: EnmapOptions,
    );

    /**
     * Sets a value in Enmap.
     * @param key Required. The key of the element to add to The Enmap.
     * @param val Required. The value of the element to add to The Enmap.
     * If the Enmap is persistent this value MUST be stringifiable as JSON.
     * @example
     * // Direct Value Examples
     * enmap.set('simplevalue', 'this is a string');
     * enmap.set('isEnmapGreat', true);
     * enmap.set('TheAnswer', 42);
     * enmap.set('IhazObjects', { color: 'black', action: 'paint', desire: true });
     * enmap.set('ArraysToo', [1, "two", "tree", "foor"])
     *
     * @returns The enmap.
     */
    public set(key: K, val: V): this;

    /**
     * Sets a value in Enmap.
     * @param key Required. The key of the element to add to The Enmap.
     * @param val Required. The value of the element to add to The Enmap.
     * If the Enmap is persistent this value MUST be stringifiable as JSON.
     * @param path The path to the property to modify inside the value object or array.
     * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
     * @example
     * // Settings Properties
     * enmap.set('IhazObjects', 'color', 'blue'); //modified previous object
     * enmap.set('ArraysToo', 2, 'three'); // changes "tree" to "three" in array.
     * @returns The enmap.
     */
    public set(key: K, val: any, path: string): this;

    /**
     * Update an existing object value in Enmap by merging new keys.
     * This only works on objects, any other value will throw an error.
     * Heavily inspired by setState from React's class components.
     * This is very useful if you have many different values to update,
     * and don't want to have more than one .set(key, value, prop) lines.
     * @param key Required. The key of the object to update.
     * @param valueOrFunction Required. Either an object to merge with the existing value,
     * or a function that provides the existing object and expects a new object as a return value.
     * In the case of a straight value, the merge is recursive and will add any missing level.
     * If using a function, it is your responsibility to merge the objects together correctly.
     */
    public update(key: K, valueOrFunction: V | ((value: V) => V)): V;

    /**
     * Retrieves a key from the enmap. If fetchAll is false, returns a promise.
     * @param key The key to retrieve from the enmap.
     * @param path Optional. The property to retrieve from the object or array.
     * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
     * @example
     * const myKeyValue = enmap.get("myKey");
     * console.log(myKeyValue);
     *
     * const someSubValue = enmap.get("anObjectKey", "someprop.someOtherSubProp");
     * @return The value for this key.
     */
    public get(key: K): V | undefined;
    public get<P extends keyof V>(key: K, path: P): V[P] | undefined;
    public get<P extends Path<V>>(key: K, path: P): PathValue<V, P> | undefined;
    public get(key: K, path: string): unknown;

    /**
     * Fetches every key from the persistent enmap and loads them into the current enmap value.
     * @return The enmap containing all values.
     */
    public fetchEverything(): this;

    /**
     * Force fetch one or more key values from the enmap. If the database has changed, that new value is used.
     * @param keys A single key or array of keys to force fetch from the enmap database.
     * @return The Enmap, including the new fetched values
     */
    public fetch(keys: K[]): this;

    /**
     * Force fetch one or more key values from the enmap. If the database has changed, that new value is used.
     * @param key A single key to force fetch from the enmap database.
     * @return The value.
     */
    public fetch(key: K): V;

    /**
     * Removes a key or keys from the cache - useful when disabling autoFetch.
     * @param keyOrArrayOfKeys A single key or array of keys to remove from the cache.
     * @returns the Enmap minus the evicted keys.
     */
    public evict(keyOrArrayOfKeys: K | K[]): this;

    /**
     * Function called whenever data changes within Enmap after the initial load.
     * Can be used to detect if another part of your code changed a value in enmap and react on it.
     * @example
     * enmap.changed((keyName, oldValue, newValue) => {
     *   console.log(`Value of ${keyName} has changed from: \n${oldValue}\nto\n${newValue});
     * });
     * @param cb A callback function that will be called whenever data changes in the enmap.
     */
    public changed(
      cb: (key: K, oldValue: V | undefined, newValue: V | undefined) => void,
    ): void;

    /**
     * Shuts down the database. WARNING: USING THIS MAKES THE ENMAP UNUSEABLE. You should
     * only use this method if you are closing your entire application.
     * Note that honestly I've never had to use this, shutting down the app without a close() is fine.
     * @return The promise of the database closing operation.
     */
    public close(): Promise<void>;

    /**
     * Modify the property of a value inside the enmap, if the value is an object or array.
     * This is a shortcut to loading the key, changing the value, and setting it back.
     * @param key Required. The key of the element to add to The Enmap or array.
     * This value MUST be a string or number.
     * @param path Required. The property to modify inside the value object or array.
     * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
     * @param val Required. The value to apply to the specified property.
     * @returns The enmap.
     */
    public setProp(key: K, path: string, val: any): this;

    /**
     * Push to an array value in Enmap.
     * @param key Required. The key of the array element to push to in Enmap.
     * This value MUST be a string or number.
     * @param val Required. The value to push to the array.
     * @param path Optional. The path to the property to modify inside the value object or array.
     * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
     * @param allowDupes Optional. Allow duplicate values in the array (default: false).
     * @example
     * // Assuming
     * enmap.set("simpleArray", [1, 2, 3, 4]);
     * enmap.set("arrayInObject", {sub: [1, 2, 3, 4]});
     *
     * enmap.push("simpleArray", 5); // adds 5 at the end of the array
     * enmap.push("arrayInObject", "five", "sub"); adds "five" at the end of the sub array
     * @returns The enmap.
     */
    public push(key: K, val: any, path?: string, allowDupes?: boolean): this;

    /**
     * Push to an array element inside an Object or Array element in Enmap.
     * @param key Required. The key of the element.
     * This value MUST be a string or number.
     * @param path Required. The name of the array property to push to.
     * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
     * @param val Required. The value push to the array property.
     * @param allowDupes Allow duplicate values in the array (default: false).
     * @returns The enmap.
     */
    public pushIn(key: K, path: string, val: any, allowDupes?: boolean): this;

    // AWESOME MATHEMATICAL METHODS

    /**
     * Executes a mathematical operation on a value and saves it in the enmap.
     * @param key The enmap key on which to execute the math operation.
     * @param operation Which mathematical operation to execute. Supports most
     * math ops: =, -, *, /, %, ^, and english spelling of those operations.
     * @param operand The right operand of the operation.
     * @param path Optional. The property path to execute the operation on, if the value is an object or array.
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
     * @returns The enmap.
     */
    public math(
      key: K,
      operation: MathOps,
      operand: number,
      path?: string,
    ): this;

    /**
     * Increments a key's value or property by 1. Value must be a number, or a path to a number.
     * @param key The enmap key where the value to increment is stored.
     * @param path Optional. The property path to increment, if the value is an object or array.
     * @example
     * // Assuming
     * points.set("number", 42);
     * points.set("numberInObject", {sub: { anInt: 5 }});
     *
     * points.inc("number"); // 43
     * points.inc("numberInObject", "sub.anInt"); // {sub: { anInt: 6 }}
     * @returns The enmap.
     */
    public inc(key: K, path?: string): this;

    /**
     * Decrements a key's value or property by 1. Value must be a number, or a path to a number.
     * @param key The enmap key where the value to decrement is stored.
     * @param path Optional. The property path to decrement, if the value is an object or array.
     * @example
     * // Assuming
     * points.set("number", 42);
     * points.set("numberInObject", {sub: { anInt: 5 }});
     *
     * points.dec("number"); // 41
     * points.dec("numberInObject", "sub.anInt"); // {sub: { anInt: 4 }}
     * @returns The enmap.
     */
    public dec(key: K, path?: string): this;

    /**
     * Returns the specific property within a stored value. If the key does not exist or the value is not an object, throws an error.
     * @param key Required. The key of the element to get from The Enmap.
     * @param path Required. The property to retrieve from the object or array.
     * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
     * @return The value of the property obtained.
     */
    public getProp(key: K, path: string): any;

    /**
     * Returns the key's value, or the default given, ensuring that the data is there.
     * This is a shortcut to "if enmap doesn't have key, set it, then get it" which is a very common pattern.
     * @param key Required. The key you want to make sure exists.
     * @param defaultValue Required. The value you want to save in the database and return as default.
     * @param path Optional. If presents, ensures both the key exists as an object, and the full path exists.
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
     * @return The value from the database for the key, or the default value provided for a new key.
     */
    public ensure(key: K, defaultValue: V, path?: string): V;

    /* BOOLEAN METHODS THAT CHECKS FOR THINGS IN ENMAP */

    /**
     * Returns whether or not the key exists in the Enmap.
     * @param key Required. The key of the element to add to The Enmap or array.
     * This value MUST be a string or number.
     * @param path Optional. The property to verify inside the value object or array.
     * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
     * @example
     * if(enmap.has("myKey")) {
     *   // key is there
     * }
     *
     * if(!enmap.has("myOtherKey", "oneProp.otherProp.SubProp")) return false;
     */
    public has(key: K, path?: string): boolean;

    /**
     * Returns whether or not the property exists within an object or array value in enmap.
     * @param key Required. The key of the element to check in the Enmap or array.
     * @param path Required. The property to verify inside the value object or array.
     * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
     * @return Whether the property exists.
     */
    public hasProp(key: K, path: string): boolean;

    /**
     * Deletes a key in the Enmap.
     * Note: Does not return a boolean, unlike the standard Map.
     * @param key Required. The key of the element to delete from The Enmap.
     * @param path Optional. The name of the property to remove from the object.
     * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
     * @returns The enmap.
     */
    public delete(key: K, path?: string): this;

    /**
     * Delete a property from an object or array value in Enmap.
     * @param key Required. The key of the element to delete the property from in Enmap.
     * @param path Required. The name of the property to remove from the object.
     * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
     */
    public deleteProp(key: K, path: string): void;

    /**
     * Deletes everything from the enmap. If persistent, clears the database of all its data for this table.
     */
    public deleteAll(): void;

    public clear(): void;

    /**
     * Remove a value in an Array or Object element in Enmap. Note that this only works for
     * values, not keys. Complex values such as objects and arrays will not be removed this way.
     * @param key Required. The key of the element to remove from in Enmap.
     * This value MUST be a string or number.
     * @param val Required. The value to remove from the array or object.
     * @param path Optional. The name of the array property to remove from.
     * Can be a path with dot notation, such as "prop1.subprop2.subprop3".
     * If not presents, removes directly from the value.
     * @returns The enmap.
     */
    public remove(key: K, val: V, path?: string): this;

    /**
     * Remove a value from an Array or Object property inside an Array or Object element in Enmap.
     * Confusing? Sure is.
     * @param key Required. The key of the element.
     * This value MUST be a string or number.
     * @param path Required. The name of the array property to remove from.
     * Can be a path with dot notation, such as "prop1.subprop2.subprop3"
     * @param val Required. The value to remove from the array property.
     * @returns The enmap.
     */
    public removeFrom(key: K, path: string, val: any): this;

    /**
     * Initialize multiple Enmaps easily.
     * @param names Array of strings. Each array entry will create a separate enmap with that name.
     * @param options Options object to pass to the provider. See provider documentation for its options.
     * @example
     * // Using local variables and the mongodb provider.
     * const Enmap = require('enmap');
     * const { settings, tags, blacklist } = Enmap.multi(['settings', 'tags', 'blacklist']);
     *
     * // Attaching to an existing object (for instance some API's client)
     * const Enmap = require("enmap");
     * Object.assign(client, Enmap.multi(["settings", "tags", "blacklist"]));
     *
     * @returns An array of initialized Enmaps.
     */
    public static multi<K extends string | number, V>(
      names: string[],
      options?: EnmapOptions,
    ): Enmap<K, V>[];

    /* INTERNAL (Private) METHODS */

    /**
     * Internal Method. Initializes the enmap depending on given values.
     * @param pool In order to set data to the Enmap, one must be provided.
     * @returns Returns the defer promise to await the ready state.
     */
    private _init(pool: any): Promise<void>;

    /**
     * INTERNAL method to verify the type of a key or property
     * Will THROW AN ERROR on wrong type, to simplify code.
     * @param key Required. The key of the element to check
     * @param type Required. The javascript constructor to check
     * @param path Optional. The dotProp path to the property in the object enmap.
     */
    private _check(key: K, type: string, path?: string): void;

    /**
     * INTERNAL method to execute a mathematical operation. Cuz... javascript.
     * And I didn't want to import mathjs!
     * @param base the lefthand operand.
     * @param op the operation.
     * @param opand the righthand operand.
     * @return the result.
     */
    private _mathop(base: number, op: string, opand: number): number;

    /**
     * Internal method used to validate persistent enmap names (valid Windows filenames)
     */
    private _validateName(): void;

    /**
     * Internal Method. Verifies if a key needs to be fetched from the database.
     * If persistent enmap and autoFetch is on, retrieves the key.
     * @param key The key to check or fetch.
     */
    private _fetchCheck(key: K, force?: boolean): void;

    /**
     * Internal Method. Parses JSON data.
     * Reserved for future use (logical checking)
     * @param data The data to check/parse
     * @returns An object or the original data.
     */
    private _parseData(data: any): any;

    /**
     * Internal Method. Clones a value or object with the enmap's set clone level.
     * @param data The data to clone.
     * @return The cloned value.
     */
    private _clone(data: any): any;

    /**
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
     * or if you change the length of the array itself. If you don't want this caching behavior,
     * use `Array.from(enmap.values())` instead.
     */
    public array(): V[];

    /**
     * Creates an ordered array of the keys of this Enmap
     * The array will only be reconstructed if an item is added to or removed from the Enmap,
     * or if you change the length of the array itself. If you don't want this caching behavior,
     * use `Array.from(enmap.keys())` instead.
     */
    public keyArray(): K[];

    /**
     * Obtains a random value from this Enmap. This relies on {@link Enmap#array}.
     * @returns A random value from the Enmap.
     */
    public random(): V;

    /**
     * Obtains random values from this Enmap. This relies on {@link Enmap#array}.
     * @param count Number of values to obtain randomly
     * @returns An array of values of `count` length
     */
    public random(count: number): V[];

    /**
     * Obtains a random key from this Enmap. This relies on {@link Enmap#keyArray}
     * @returns A random key from the Enmap
     */
    public randomKey(): K;

    /**
     * Obtains random keys from this Enmap. This relies on {@link Enmap#keyArray}
     * @param count Number of keys to obtain randomly
     * @returns An array of keys of `count` length
     */
    public randomKey(count: number): V[];

    /**
     * Searches for all items where their specified property's value is identical to the given value
     * (`item[prop] === value`).
     * @param prop The property to test against
     * @param value The expected value
     * @example
     * enmap.findAll('username', 'Bob');
     */
    public findAll(prop: string, value: any): V[];

    /**
     * Searches for a single item where the given function returns a truthy value. This is identical to [Array.find()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find).
     * <warn>All Enmap used in Discord.js are mapped using their `id` property, and if you want to find by id you
     * should use the `get` method. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get) for details.</warn>
     * @param fn The function to test with
     * @example
     * enmap.find(val => val.username === 'Bob');
     */
    public find(fn: (val: V, key: K, enmap: this) => boolean): V | undefined;

    /**
     * Searches for a single item where its specified property's value is identical to the given value
     * (`item[prop] === value`)
     * <warn>All Enmap used in Discord.js are mapped using their `id` property, and if you want to find by id you
     * should use the `get` method. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get) for details.</warn>
     * @param prop The property to test against.
     * @param value The expected value
     * @example
     * enmap.find('username', 'Bob');
     */
    public find(prop: string, value: any): V | undefined;

    /**
     * Searches for the key of a single item where the given function returns a truthy value. This is identical to
     * [Array.findIndex()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex).
     * @param fn The function to test with.
     * @example
     * enmap.findKey(val => val.username === 'Bob');
     */
    public findKey(fn: (val: V, key: K, enmap: this) => boolean): K | undefined;
    /**
     * Searches for the key of a single item where its specified property's value is identical to the given value
     * (`item[prop] === value`), or the given function returns a truthy value. In the latter case,
     * @param prop The property to test against, or the function to test with
     * @param value The expected value - only applicable and required if using a property for the first argument
     * @example
     * enmap.findKey('username', 'Bob');
     */
    public findKey(prop: string, value: any): K | undefined;

    /**
     * Searches for the existence of a single item where its specified property's value is identical to the given value
     * (`item[prop] === value`).
     * <warn>Do not use this to check for an item by its ID. Instead, use `enmap.has(id)`. See
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has) for details.</warn>
     * @param prop The property to test against
     * @param value The expected value
     * @example
     * if (enmap.exists('username', 'Bob')) {
     *  console.log('user here!');
     * }
     */
    public exists(prop: string, value: any): boolean;

    /**
     * Removes entries that satisfy the provided filter function.
     * @param fn Function used to test (should return a boolean)
     * @param thisArg Value to use as `this` when executing function
     * @returns The number of removed entries
     */
    public sweep(
      fn: (val: V, key: K, enmap: this) => boolean,
      thisArg?: any,
    ): number;

    /**
     * Identical to [Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter),
     * but returns a Enmap instead of an Array.
     * @param fn Function used to test (should return a boolean)
     * @param thisArg Value to use as `this` when executing function
     */
    public filter(
      fn: (val: V, key: K, enmap: this) => boolean,
      thisArg?: any,
    ): this;

    /**
     * Identical to
     * [Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).
     * @param fn Function used to test (should return a boolean)
     * @param thisArg Value to use as `this` when executing function
     */
    public filterArray(
      fn: (val: V, key: K, enmap: this) => boolean,
      thisArg?: any,
    ): V[];

    /**
     * Partitions the collection into two collections where the first collection
     * contains the items that passed and the second contains the items that failed.
     * @param fn Function used to test (should return a boolean)
     * @param thisArg Value to use as `this` when executing function
     * @example
     * const [big, small] = collection.partition(guild => guild.memberCount > 250);
     */
    public partition(
      fn: (val: V, key: K, enmap: this) => boolean,
      thisArg?: any,
    ): [Enmap, Enmap];

    /**
     * Identical to
     * [Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).
     * @param fn Function that produces an element of the new array, taking three arguments
     * @param thisArg Value to use as `this` when executing function
     */
    public map<R>(fn: (val: V, key: K, enmap: this) => R, thisArg?: any): R[];

    /**
     * Identical to
     * [Array.some()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some).
     * @param fn Function used to test (should return a boolean)
     * @param thisArg Value to use as `this` when executing function
     */
    public some(
      fn: (val: V, key: K, enmap: this) => boolean,
      thisArg?: any,
    ): boolean;

    /**
     * Identical to
     * [Array.every()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every).
     * @param fn Function used to test (should return a boolean)
     * @param thisArg Value to use as `this` when executing function
     */
    public every(
      fn: (val: V, key: K, enmap: this) => boolean,
      thisArg?: any,
    ): boolean;

    /**
     * Identical to
     * [Array.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce).
     * @param fn Function used to reduce, taking four arguments; `accumulator`, `currentValue`, `currentKey`, and `enmap`
     * @param initialValue Starting value for the accumulator
     */
    public reduce(
      fn: (acc: V, val: V, key: K, enmap: this) => V,
      initialValue?: V,
    ): V;

    /**
     * Identical to
     * [Array.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce).
     * @param fn Function used to reduce, taking four arguments; `accumulator`, `currentValue`, `currentKey`, and `enmap`
     * @param initialValue Starting value for the accumulator
     */
    public reduce<R>(
      fn: (acc: R, val: V, key: K, enmap: this) => V,
      initialValue: R,
    ): R;

    /**
     * Creates an identical shallow copy of this Enmap.
     * @example
     * const newColl = someColl.clone();
     */
    public clone(): Enmap<K, V>;

    /**
     * Combines this Enmap with others into a new Enmap. None of the source Enmaps are modified.
     * @param enmaps Enmaps to merge
     * @example
     * const newColl = someColl.concat(someOtherColl, anotherColl, ohBoyAColl);
     */
    public concat(...enmaps: Enmap<K, V>[]): Enmap<K, V>;

    /**
     * Checks if this Enmap shares identical key-value pairings with another.
     * This is different to checking for equality using equal-signs, because
     * the Enmaps may be different objects, but contain the same data.
     * @param enmap Enmap to compare with
     * @returns Whether the Enmaps have identical contents
     */
    public equals(enmap: Enmap<K, V>): boolean;
  }
}
