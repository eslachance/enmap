<a name="Enmap"></a>

## Enmap ⇐ <code>Map</code>
A enhanced Map structure with additional utility methods.
Can be made persistent

**Kind**: global class  
**Extends**: <code>Map</code>  

* [Enmap](#enmap-map) ⇐ <code>Map</code>
    * [new Enmap(iterable, [options])](#new-enmap-iterable-options)
    * _instance_
        * [.count](#enmap-count-number) ⇒ <code>number</code>
        * [.indexes](#enmap-indexes-array-less-than-string-greater-than) ⇒ <code>Array.&lt;string&gt;</code>
        * [.db](#enmap-db-database) ⇒ <code>Database</code>
        * [.autonum](#enmap-autonum-number) ⇒ <code>number</code>
        * [.set(key, val, path)](#enmap-set-key-val-path-enmap) ⇒ [<code>Enmap</code>]
        * [.update(key, valueOrFunction)](#enmap-update-key-valueorfunction)
        * [.get(key, path)](#enmap-get-key-path) ⇒ <code>\*</code>
        * [.observe(key, path)](#enmap-observe-key-path) ⇒ <code>\*</code>
        * [.fetchEverything()](#enmap-fetcheverything-enmap) ⇒ [<code>Enmap</code>]
        * [.fetch(keyOrKeys)](#enmap-fetch-keyorkeys-enmap-enmap-or) ⇒ [<code>Enmap</code>](#enmap-map) \| <code>\*</code>
        * [.evict(keyOrArrayOfKeys)](#enmap-evict-keyorarrayofkeys-enmap) ⇒ [<code>Enmap</code>]
        * [.changed(cb)](#enmap-changed-cb)
        * [.close()](#enmap-close-enmap) ⇒ [<code>Enmap</code>]
        * [.push(key, val, path, allowDupes)](#enmap-push-key-val-path-allowdupes-enmap) ⇒ [<code>Enmap</code>]
        * [.math(key, operation, operand, path)](#enmap-math-key-operation-operand-path-enmap) ⇒ [<code>Enmap</code>]
        * [.inc(key, path)](#enmap-inc-key-path-enmap) ⇒ [<code>Enmap</code>]
        * [.dec(key, path)](#enmap-dec-key-path-enmap) ⇒ [<code>Enmap</code>]
        * [.ensure(key, defaultValue, path)](#enmap-ensure-key-defaultvalue-path) ⇒ <code>\*</code>
        * [.has(key, path)](#enmap-has-key-path-boolean) ⇒ <code>boolean</code>
        * [.includes(key, val, path)](#enmap-includes-key-val-path-boolean) ⇒ <code>boolean</code>
        * [.delete(key, path)](#enmap-delete-key-path-enmap) ⇒ [<code>Enmap</code>]
        * [.deleteAll()](#enmap-deleteall)
        * [.clear()](#enmap-clear-void) ⇒ <code>void</code>
        * [.destroy()](#enmap-destroy-null) ⇒ <code>null</code>
        * [.remove(key, val, path)](#enmap-remove-key-val-path-enmap) ⇒ [<code>Enmap</code>]
        * [.export()](#enmap-export-string) ⇒ <code>string</code>
        * [.import(data, overwrite, clear)](#enmap-import-data-overwrite-clear-enmap) ⇒ [<code>Enmap</code>]
        * [.array()](#enmap-array-array) ⇒ <code>Array</code>
        * [.keyArray()](#enmap-keyarray-array-less-than-string-or-number-greater-than) ⇒ <code>Array.&lt;(string\|number)&gt;</code>
        * [.random([count])](#enmap-random-count-or-array-less-than-greater-than) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
        * [.randomKey([count])](#enmap-randomkey-count-or-array-less-than-greater-than) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
        * [.findAll(prop, value)](#enmap-findall-prop-value-array) ⇒ <code>Array</code>
        * [.find(propOrFn, [value])](#enmap-find-proporfn-value) ⇒ <code>\*</code>
        * [.findKey(propOrFn, [value])](#enmap-findkey-proporfn-value-string-or-number) ⇒ <code>string</code> \| <code>number</code>
        * [.sweep(fn, [thisArg])](#enmap-sweep-fn-thisarg-number) ⇒ <code>number</code>
        * [.filter(fn, [thisArg])](#enmap-filter-fn-thisarg-enmap) ⇒ [<code>Enmap</code>]
        * [.filterArray(fn, [thisArg])](#enmap-filterarray-fn-thisarg-array) ⇒ <code>Array</code>
        * [.map(fn, [thisArg])](#enmap-map-fn-thisarg-array) ⇒ <code>Array</code>
        * [.some(fn, [thisArg])](#enmap-some-fn-thisarg-boolean) ⇒ <code>boolean</code>
        * [.every(fn, [thisArg])](#enmap-every-fn-thisarg-boolean) ⇒ <code>boolean</code>
        * [.reduce(fn, [initialValue])](#enmap-reduce-fn-initialvalue) ⇒ <code>\*</code>
        * [.clone()](#enmap-clone-enmap) ⇒ [<code>Enmap</code>]
        * [.concat(...enmaps)](#enmap-concat-enmaps-enmap) ⇒ [<code>Enmap</code>]
        * ~~[.partition(fn, [thisArg])](#Enmap+partition) ⇒ [<code>Array.&lt;Enmap&gt;</code>](#Enmap)~~
        * ~~[.equals(enmap)](#Enmap+equals) ⇒ <code>boolean</code>~~
        * ~~[.setProp(key, path, val)](#Enmap+setProp) ⇒ [<code>Enmap</code>](#enmap-map)~~
        * ~~[.pushIn(key, path, val, allowDupes)](#Enmap+pushIn) ⇒ [<code>Enmap</code>](#enmap-map)~~
        * ~~[.getProp(key, path)](#Enmap+getProp) ⇒ <code>\*</code>~~
        * ~~[.deleteProp(key, path)](#Enmap+deleteProp)~~
        * ~~[.removeFrom(key, path, val)](#Enmap+removeFrom) ⇒ [<code>Enmap</code>](#enmap-map)~~
        * ~~[.hasProp(key, path)](#Enmap+hasProp) ⇒ <code>boolean</code>~~
        * ~~[.exists(prop, value)](#Enmap+exists) ⇒ <code>boolean</code>~~
    * _static_
        * [.multi(names, options)](#enmap-multi-names-options-object) ⇒ <code>Object</code>

<a name="new_Enmap_new"></a>

### new Enmap(iterable, [options])
Initializes a new Enmap, with options.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| iterable | <code>Iterable</code> \| <code>string</code> \| <code>void</code> |  | If iterable data, only valid in non-persistent enmaps. If this parameter is a string, it is assumed to be the Enmap's name, which is a shorthand for adding a name in the options and making the enmap persistent. |
| [options] | <code>Object</code> |  | Additional options for the enmap. See https://enmap.evie.codes/usage#enmap-options for details. |
| [options.name] | <code>string</code> |  | The name of the enmap. Represents its table name in sqlite. If present, the enmap is persistent. If no name is given, the enmap is memory-only and is not saved in the database. As a shorthand, you may use a string for the name instead of the options (see example). |
| [options.fetchAll] | <code>boolean</code> |  | Defaults to `true`. When enabled, will automatically fetch any key that's requested using get, or other retrieval methods. This is a "synchronous" operation, which means it doesn't need any of this promise or callback use. |
| [options.dataDir] | <code>string</code> |  | Defaults to `./data`. Determines where the sqlite files will be stored. Can be relative (to your project root) or absolute on the disk. Windows users , remember to escape your backslashes! *Note*: Will not automatically create the folder if set manually, so make sure it exists. |
| [options.cloneLevel] | <code>string</code> |  | Defaults to deep. Determines how objects and arrays are treated when inserting and retrieving from the database. See https://enmap.evie.codes/usage#enmap-options for more details on this option. |
| [options.polling] | <code>boolean</code> |  | defaults to `false`. Determines whether Enmap will attempt to retrieve changes from the database on a regular interval. This means that if another Enmap in another process modifies a value, this change will be reflected in ALL enmaps using the polling feature. |
| [options.pollingInterval] | <code>number</code> |  | defaults to `1000`, polling every second. Delay in milliseconds to poll new data from the database. The shorter the interval, the more CPU is used, so it's best not to lower this. Polling takes about 350-500ms if no data is found, and time will grow with more changes fetched. In my tests, 15 rows took a little more than 1 second, every second. |
| [options.ensureProps] | <code>boolean</code> |  | defaults to `true`. If enabled and the value in the enmap is an object, using ensure() will also ensure that every property present in the default object will be added to the value, if it's absent. See ensure API reference for more information. |
| [options.autoEnsure] | <code>\*</code> |  | default is disabled. When provided a value, essentially runs ensure(key, autoEnsure) automatically so you don't have to. This is especially useful on get(), but will also apply on set(), and any array and object methods that interact with the database. |
| [options.autoFetch] | <code>boolean</code> |  | defaults to `true`. When enabled, attempting to get() a key or do any operation on existing keys (such as array push, etc) will automatically fetch the current key value from the database. Keys that are automatically fetched remain in memory and are not cleared. |
| [options.serializer] | <code>function</code> |  | Optional. If a function is provided, it will execute on the data when it is written to the database. This is generally used to convert the value into a format that can be saved in the database, such as converting a complete class instance to just its ID. This function may return the value to be saved, or a promise that resolves to that value (in other words, can be an async function). |
| [options.deserializer] | <code>function</code> |  | Optional. If a function is provided, it will execute on the data when it is read from the database. This is generally used to convert the value from a stored ID into a more complex object. This function may return a value, or a promise that resolves to that value (in other words, can be an async function). |
| [options.wal] | <code>boolean</code> | <code>false</code> | Check out Write-Ahead Logging: https://www.sqlite.org/wal.html |
| [options.verbose] | <code>function</code> | <code>(query) &#x3D;&gt; null</code> | A function to call with the direct SQL statement being ran by Enmap internally |

**Example**  
```js
const Enmap = require("enmap");
// Non-persistent enmap:
const inMemory = new Enmap();

// Named, Persistent enmap with string option
const myEnmap = new Enmap("testing");

// Enmap that does not fetch everything, but does so on per-query basis:
const myEnmap = new Enmap({name: "testing", fetchAll: false});

// Enmap that automatically assigns a default object when getting or setting anything.
const autoEnmap = new Enmap({name: "settings", autoEnsure: { setting1: false, message: "default message"}})
```
<a name="Enmap+count"></a>

### enmap.count ⇒ <code>number</code>
Retrieves the number of rows in the database for this enmap, even if they aren't fetched.

**Kind**: instance property of [<code>Enmap</code>](#enmap-map)  
**Returns**: <code>number</code> - The number of rows in the database.  
<a name="Enmap+indexes"></a>

### enmap.indexes ⇒ <code>Array.&lt;string&gt;</code>
Retrieves all the indexes (keys) in the database for this enmap, even if they aren't fetched.

**Kind**: instance property of [<code>Enmap</code>](#enmap-map)  
**Returns**: <code>Array.&lt;string&gt;</code> - Array of all indexes (keys) in the enmap, cached or not.  
<a name="Enmap+db"></a>

### enmap.db ⇒ <code>Database</code>
Get the better-sqlite3 database object. Useful if you want to directly query or interact with the
underlying SQLite database. Use at your own risk, as errors here might cause loss of data or corruption!

**Kind**: instance property of [<code>Enmap</code>](#enmap-map)  
<a name="Enmap+autonum"></a>

### enmap.autonum ⇒ <code>number</code>
Generates an automatic numerical key for inserting a new value.
This is a "weak" method, it ensures the value isn't duplicated, but does not
guarantee it's sequential (if a value is deleted, another can take its place).
Useful for logging, actions, items, etc - anything that doesn't already have a unique ID.

**Kind**: instance property of [<code>Enmap</code>](#enmap-map)  
**Returns**: <code>number</code> - The generated key number.  
**Example**  
```js
enmap.set(enmap.autonum, "This is a new value");
```
<a name="Enmap+set"></a>

### enmap.set(key, val, path) ⇒ [<code>Enmap</code>](#enmap-map)
Sets a value in Enmap.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: [<code>Enmap</code>](#enmap-map) - The enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | Required. The key of the element to add to The Enmap. |
| val | <code>\*</code> |  | Required. The value of the element to add to The Enmap. If the Enmap is persistent this value MUST be stringifiable as JSON. |
| path | <code>string</code> | <code>null</code> | Optional. The path to the property to modify inside the value object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

**Example**  
```js
// Direct Value Examples
enmap.set('simplevalue', 'this is a string');
enmap.set('isEnmapGreat', true);
enmap.set('TheAnswer', 42);
enmap.set('IhazObjects', { color: 'black', action: 'paint', desire: true });
enmap.set('ArraysToo', [1, "two", "tree", "foor"])

// Settings Properties
enmap.set('IhazObjects', 'blue', 'color'); //modified previous object
enmap.set('ArraysToo', 'three', 2); // changes "tree" to "three" in array.
```
<a name="Enmap+update"></a>

### enmap.update(key, valueOrFunction)
Update an existing object value in Enmap by merging new keys. **This only works on objects**, any other value will throw an error.
Heavily inspired by setState from React's class components.
This is very useful if you have many different values to update and don't want to have more than one .set(key, value, prop) lines.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The key of the object to update. |
| valueOrFunction | <code>\*</code> | Either an object to merge with the existing value, or a function that provides the existing object and expects a new object as a return value. In the case of a straight value, the merge is recursive and will add any missing level. If using a function, it is your responsibility to merge the objects together correctly. |

**Example**  
```js
// Define an object we're going to update
enmap.set("obj", { a: 1, b: 2, c: 3 });

// Direct merge
enmap.update("obj", { d: 4, e: 5 });
// obj is now { a: 1, b: 2, c: 3, d: 4, e: 5 }

// Functional update
enmap.update("obj", (previous) => ({
  ...obj,
  f: 6,
  g: 7
}));
// this example takes heavy advantage of the spread operators.
// More info: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
```
<a name="Enmap+get"></a>

### enmap.get(key, path) ⇒ <code>\*</code>
Retrieves a key from the enmap.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: <code>\*</code> - The value for this key.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | The key to retrieve from the enmap. |
| path | <code>string</code> | <code>null</code> | Optional. The property to retrieve from the object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

**Example**  
```js
const myKeyValue = enmap.get("myKey");
console.log(myKeyValue);

const someSubValue = enmap.get("anObjectKey", "someprop.someOtherSubProp");
```
<a name="Enmap+observe"></a>

### enmap.observe(key, path) ⇒ <code>\*</code>
Returns an observable object. Modifying this object or any of its properties/indexes/children
will automatically save those changes into enmap. This only works on
objects and arrays, not "basic" values like strings or integers.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: <code>\*</code> - The value for this key.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>\*</code> |  | The key to retrieve from the enmap. |
| path | <code>string</code> | <code>null</code> | Optional. The property to retrieve from the object or array. |

<a name="Enmap+fetchEverything"></a>

### enmap.fetchEverything() ⇒ [<code>Enmap</code>](#enmap-map)
Fetches every key from the persistent enmap and loads them into the current enmap value.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: [<code>Enmap</code>](#enmap-map) - The enmap containing all values.  
<a name="Enmap+fetch"></a>

### enmap.fetch(keyOrKeys) ⇒ [<code>Enmap</code>](#enmap-map) \| <code>\*</code>
Force fetch one or more key values from the enmap. If the database has changed, that new value is used.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: [<code>Enmap</code>](#enmap-map) \| <code>\*</code> - The Enmap, including the new fetched values, or the value in case the function argument is a single key.  

| Param | Type | Description |
| --- | --- | --- |
| keyOrKeys | <code>string</code> \| <code>number</code> \| <code>Array.&lt;(string\|number)&gt;</code> | A single key or array of keys to force fetch from the enmap database. |

<a name="Enmap+evict"></a>

### enmap.evict(keyOrArrayOfKeys) ⇒ [<code>Enmap</code>](#enmap-map)
Removes a key or keys from the cache - useful when disabling autoFetch.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: [<code>Enmap</code>](#enmap-map) - The enmap minus the evicted keys.  

| Param | Type | Description |
| --- | --- | --- |
| keyOrArrayOfKeys | <code>string</code> \| <code>number</code> \| <code>Array.&lt;(string\|number)&gt;</code> | A single key or array of keys to remove from the cache. |

<a name="Enmap+changed"></a>

### enmap.changed(cb)
Function called whenever data changes within Enmap after the initial load.
Can be used to detect if another part of your code changed a value in enmap and react on it.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | A callback function that will be called whenever data changes in the enmap. |

**Example**  
```js
enmap.changed((keyName, oldValue, newValue) => {
  console.log(`Value of ${keyName} has changed from: \n${oldValue}\nto\n${newValue}`);
});
```
<a name="Enmap+close"></a>

### enmap.close() ⇒ [<code>Enmap</code>](#enmap-map)
Shuts down the database. WARNING: USING THIS MAKES THE ENMAP UNUSABLE. You should
only use this method if you are closing your entire application.
This is already done by Enmap automatically on shutdown unless you disabled it.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: [<code>Enmap</code>](#enmap-map) - The enmap.  
<a name="Enmap+push"></a>

### enmap.push(key, val, path, allowDupes) ⇒ [<code>Enmap</code>](#enmap-map)
Push to an array value in Enmap.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: [<code>Enmap</code>](#enmap-map) - The enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | Required. The key of the array element to push to in Enmap. This value MUST be a string or number. |
| val | <code>\*</code> |  | Required. The value to push to the array. |
| path | <code>string</code> | <code>null</code> | Optional. The path to the property to modify inside the value object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |
| allowDupes | <code>boolean</code> | <code>false</code> | Optional. Allow duplicate values in the array (default: false). |

**Example**  
```js
// Assuming
enmap.set("simpleArray", [1, 2, 3, 4]);
enmap.set("arrayInObject", {sub: [1, 2, 3, 4]});

enmap.push("simpleArray", 5); // adds 5 at the end of the array
enmap.push("arrayInObject", "five", "sub"); // adds "five" at the end of the sub array
```
<a name="Enmap+math"></a>

### enmap.math(key, operation, operand, path) ⇒ [<code>Enmap</code>](#enmap-map)
Executes a mathematical operation on a value and saves it in the enmap.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: [<code>Enmap</code>](#enmap-map) - The enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | The enmap key on which to execute the math operation. |
| operation | <code>string</code> |  | Which mathematical operation to execute. Supports most math ops: =, -, *, /, %, ^, and english spelling of those operations. |
| operand | <code>number</code> |  | The right operand of the operation. |
| path | <code>string</code> | <code>null</code> | Optional. The property path to execute the operation on, if the value is an object or array. |

**Example**  
```js
// Assuming
points.set("number", 42);
points.set("numberInObject", {sub: { anInt: 5 }});

points.math("number", "/", 2); // 21
points.math("number", "add", 5); // 26
points.math("number", "modulo", 3); // 2
points.math("numberInObject", "+", 10, "sub.anInt");
```
<a name="Enmap+inc"></a>

### enmap.inc(key, path) ⇒ [<code>Enmap</code>](#enmap-map)
Increments a key's value or property by 1. Value must be a number, or a path to a number.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: [<code>Enmap</code>](#enmap-map) - The enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | The enmap key where the value to increment is stored. |
| path | <code>string</code> | <code>null</code> | Optional. The property path to increment, if the value is an object or array. |

**Example**  
```js
// Assuming
points.set("number", 42);
points.set("numberInObject", {sub: { anInt: 5 }});

points.inc("number"); // 43
points.inc("numberInObject", "sub.anInt"); // {sub: { anInt: 6 }}
```
<a name="Enmap+dec"></a>

### enmap.dec(key, path) ⇒ [<code>Enmap</code>](#enmap-map)
Decrements a key's value or property by 1. Value must be a number, or a path to a number.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: [<code>Enmap</code>](#enmap-map) - The enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | The enmap key where the value to decrement is stored. |
| path | <code>string</code> | <code>null</code> | Optional. The property path to decrement, if the value is an object or array. |

**Example**  
```js
// Assuming
points.set("number", 42);
points.set("numberInObject", {sub: { anInt: 5 }});

points.dec("number"); // 41
points.dec("numberInObject", "sub.anInt"); // {sub: { anInt: 4 }}
```
<a name="Enmap+ensure"></a>

### enmap.ensure(key, defaultValue, path) ⇒ <code>\*</code>
Returns the key's value, or the default given, ensuring that the data is there.
This is a shortcut to "if enmap doesn't have key, set it, then get it" which is a very common pattern.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: <code>\*</code> - The value from the database for the key, or the default value provided for a new key.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | Required. The key you want to make sure exists. |
| defaultValue | <code>\*</code> |  | Required. The value you want to save in the database and return as default. |
| path | <code>string</code> | <code>null</code> | Optional. If presents, ensures both the key exists as an object, and the full path exists. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

**Example**  
```js
// Simply ensure the data exists (for using property methods):
enmap.ensure("mykey", {some: "value", here: "as an example"});
enmap.has("mykey"); // always returns true
enmap.get("mykey", "here") // returns "as an example";

// Get the default value back in a variable:
const settings = mySettings.ensure("1234567890", defaultSettings);
console.log(settings) // enmap's value for "1234567890" if it exists, otherwise the defaultSettings value.
```
<a name="Enmap+has"></a>

### enmap.has(key, path) ⇒ <code>boolean</code>
Returns whether or not the key exists in the Enmap.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | Required. The key of the element to add to The Enmap or array. This value MUST be a string or number. |
| path | <code>string</code> | <code>null</code> | Optional. The property to verify inside the value object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

**Example**  
```js
if(enmap.has("myKey")) {
  // key is there
}

if(!enmap.has("myOtherKey", "oneProp.otherProp.SubProp")) return false;
```
<a name="Enmap+includes"></a>

### enmap.includes(key, val, path) ⇒ <code>boolean</code>
Performs Array.includes() on a certain enmap value. Works similar to
[Array.includes()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes).

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: <code>boolean</code> - Whether the array contains the value.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | Required. The key of the array to check the value of. |
| val | <code>string</code> \| <code>number</code> |  | Required. The value to check whether it's in the array. |
| path | <code>string</code> | <code>null</code> | Optional. The property to access the array inside the value object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

<a name="Enmap+delete"></a>

### enmap.delete(key, path) ⇒ [<code>Enmap</code>](#enmap-map)
Deletes a key in the Enmap.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: [<code>Enmap</code>](#enmap-map) - The enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | Required. The key of the element to delete from The Enmap. |
| path | <code>string</code> | <code>null</code> | Optional. The name of the property to remove from the object. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

<a name="Enmap+deleteAll"></a>

### enmap.deleteAll()
Deletes everything from the enmap. If persistent, clears the database of all its data for this table.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
<a name="Enmap+clear"></a>

### enmap.clear() ⇒ <code>void</code>
Deletes everything from the enmap. If persistent, clears the database of all its data for this table.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
<a name="Enmap+destroy"></a>

### enmap.destroy() ⇒ <code>null</code>
Completely destroys the entire enmap. This deletes the database tables entirely.
It will not affect other enmap data in the same database, however.
THIS ACTION WILL DESTROY YOUR DATA AND CANNOT BE UNDONE.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
<a name="Enmap+remove"></a>

### enmap.remove(key, val, path) ⇒ [<code>Enmap</code>](#enmap-map)
Remove a value in an Array or Object element in Enmap. Note that this only works for
values, not keys. Note that only one value is removed, no more. Arrays of objects must use a function to remove,
as full object matching is not supported.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: [<code>Enmap</code>](#enmap-map) - The enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | Required. The key of the element to remove from in Enmap. This value MUST be a string or number. |
| val | <code>\*</code> \| <code>function</code> |  | Required. The value to remove from the array or object. OR a function to match an object. If using a function, the function provides the object value and must return a boolean that's true for the object you want to remove. |
| path | <code>string</code> | <code>null</code> | Optional. The name of the array property to remove from. Can be a path with dot notation, such as "prop1.subprop2.subprop3". If not presents, removes directly from the value. |

**Example**  
```js
// Assuming
enmap.set('array', [1, 2, 3])
enmap.set('objectarray', [{ a: 1, b: 2, c: 3 }, { d: 4, e: 5, f: 6 }])

enmap.remove('array', 1); // value is now [2, 3]
enmap.remove('objectarray', (value) => value.e === 5); // value is now [{ a: 1, b: 2, c: 3 }]
```
<a name="Enmap+export"></a>

### enmap.export() ⇒ <code>string</code>
Exports the enmap data to a JSON file.
**__WARNING__**: Does not work on memory enmaps containing complex data!

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: <code>string</code> - The enmap data in a stringified JSON format.  
<a name="Enmap+import"></a>

### enmap.import(data, overwrite, clear) ⇒ [<code>Enmap</code>](#enmap-map)
Import an existing json export from enmap from a string. This data must have been exported from enmap,
and must be from a version that's equivalent or lower than where you're importing it.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: [<code>Enmap</code>](#enmap-map) - The enmap with the new data.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>string</code> |  | The data to import to Enmap. Must contain all the required fields provided by export() |
| overwrite | <code>boolean</code> | <code>true</code> | Defaults to `true`. Whether to overwrite existing key/value data with incoming imported data |
| clear | <code>boolean</code> | <code>false</code> | Defaults to `false`. Whether to clear the enmap of all data before importing (**__WARNING__**: Any existing data will be lost! This cannot be undone.) |

<a name="Enmap+array"></a>

### enmap.array() ⇒ <code>Array</code>
Creates an ordered array of the values of this Enmap.
The array will only be reconstructed if an item is added to or removed from the Enmap,
or if you change the length of the array itself. If you don't want this caching behaviour,
use `Array.from(enmap.values())` instead.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
<a name="Enmap+keyArray"></a>

### enmap.keyArray() ⇒ <code>Array.&lt;(string\|number)&gt;</code>
Creates an ordered array of the keys of this Enmap
The array will only be reconstructed if an item is added to or removed from the Enmap,
or if you change the length of the array itself. If you don't want this caching behaviour,
use `Array.from(enmap.keys())` instead.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
<a name="Enmap+random"></a>

### enmap.random([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains random value(s) from this Enmap. This relies on [array](#Enmap+array).

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single value if `count` is undefined,
or an array of values of `count` length  

| Param | Type | Description |
| --- | --- | --- |
| [count] | <code>number</code> | Number of values to obtain randomly |

<a name="Enmap+randomKey"></a>

### enmap.randomKey([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains random key(s) from this Enmap. This relies on [keyArray](#Enmap+keyArray)

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single key if `count` is undefined,
or an array of keys of `count` length  

| Param | Type | Description |
| --- | --- | --- |
| [count] | <code>number</code> | Number of keys to obtain randomly |

<a name="Enmap+findAll"></a>

### enmap.findAll(prop, value) ⇒ <code>Array</code>
Searches for all items where their specified property's value is identical to the given value
(`item[prop] === value`).

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  

| Param | Type | Description |
| --- | --- | --- |
| prop | <code>string</code> | The property to test against |
| value | <code>\*</code> | The expected value |

**Example**  
```js
enmap.findAll('username', 'Bob');
```
<a name="Enmap+find"></a>

### enmap.find(propOrFn, [value]) ⇒ <code>\*</code>
Searches for a single item where its specified property's value is identical to the given value
(`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is identical to
[Array.find()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find).
<warn>All Enmap used in Discord.js are mapped using their `id` property, and if you want to find by id you
should use the `get` method. See
[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get) for details.</warn>

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  

| Param | Type | Description |
| --- | --- | --- |
| propOrFn | <code>string</code> \| <code>function</code> | The property to test against, or the function to test with |
| [value] | <code>\*</code> | The expected value - only applicable and required if using a property for the first argument |

**Example**  
```js
enmap.find('username', 'Bob');
```
**Example**  
```js
enmap.find(val => val.username === 'Bob');
```
<a name="Enmap+findKey"></a>

### enmap.findKey(propOrFn, [value]) ⇒ <code>string</code> \| <code>number</code>
Searches for the key of a single item where its specified property's value is identical to the given value
(`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is identical to
[Array.findIndex()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex).

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  

| Param | Type | Description |
| --- | --- | --- |
| propOrFn | <code>string</code> \| <code>function</code> | The property to test against, or the function to test with |
| [value] | <code>\*</code> | The expected value - only applicable and required if using a property for the first argument |

**Example**  
```js
enmap.findKey('username', 'Bob');
```
**Example**  
```js
enmap.findKey(val => val.username === 'Bob');
```
<a name="Enmap+sweep"></a>

### enmap.sweep(fn, [thisArg]) ⇒ <code>number</code>
Removes entries that satisfy the provided filter function.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: <code>number</code> - The number of removed entries  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to test (should return a boolean) |
| [thisArg] | <code>Object</code> | Value to use as `this` when executing function |

<a name="Enmap+filter"></a>

### enmap.filter(fn, [thisArg]) ⇒ [<code>Enmap</code>](#enmap-map)
Identical to
[Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter),
but returns a Enmap instead of an Array.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to test (should return a boolean) |
| [thisArg] | <code>Object</code> | Value to use as `this` when executing function |

<a name="Enmap+filterArray"></a>

### enmap.filterArray(fn, [thisArg]) ⇒ <code>Array</code>
Identical to
[Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to test (should return a boolean) |
| [thisArg] | <code>Object</code> | Value to use as `this` when executing function |

<a name="Enmap+map"></a>

### enmap.map(fn, [thisArg]) ⇒ <code>Array</code>
Identical to
[Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function that produces an element of the new array, taking three arguments |
| [thisArg] | <code>\*</code> | Value to use as `this` when executing function |

<a name="Enmap+some"></a>

### enmap.some(fn, [thisArg]) ⇒ <code>boolean</code>
Identical to
[Array.some()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some).

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to test (should return a boolean) |
| [thisArg] | <code>Object</code> | Value to use as `this` when executing function |

<a name="Enmap+every"></a>

### enmap.every(fn, [thisArg]) ⇒ <code>boolean</code>
Identical to
[Array.every()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every).

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to test (should return a boolean) |
| [thisArg] | <code>Object</code> | Value to use as `this` when executing function |

<a name="Enmap+reduce"></a>

### enmap.reduce(fn, [initialValue]) ⇒ <code>\*</code>
Identical to
[Array.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce).

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to reduce, taking four arguments; `accumulator`, `currentValue`, `currentKey`, and `enmap` |
| [initialValue] | <code>\*</code> | Starting value for the accumulator |

<a name="Enmap+clone"></a>

### enmap.clone() ⇒ [<code>Enmap</code>](#enmap-map)
Creates an identical shallow copy of this Enmap.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Example**  
```js
const newColl = someColl.clone();
```
<a name="Enmap+concat"></a>

### enmap.concat(...enmaps) ⇒ [<code>Enmap</code>](#enmap-map)
Combines this Enmap with others into a new Enmap. None of the source Enmaps are modified.

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  

| Param | Type | Description |
| --- | --- | --- |
| ...enmaps | [<code>Enmap</code>](#enmap-map) | Enmaps to merge |

**Example**  
```js
const newColl = someColl.concat(someOtherColl, anotherColl, ohBoyAColl);
```
<a name="Enmap+partition"></a>

### ~~enmap.partition(fn, [thisArg]) ⇒ [<code>Array.&lt;Enmap&gt;</code>](#Enmap)~~
***Deprecated***

Partitions the enmap into two enmaps where the first enmap
contains the items that passed and the second contains the items that failed.
DEPRECATION WARNING: WILL BE REMOVED IN ENMAP 6!

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to test (should return a boolean) |
| [thisArg] | <code>\*</code> | Value to use as `this` when executing function |

**Example**  
```js
const [big, small] = enmap.partition(guild => guild.memberCount > 250);
```
<a name="Enmap+equals"></a>

### ~~enmap.equals(enmap) ⇒ <code>boolean</code>~~
***Deprecated***

Checks if this Enmap shares identical key-value pairings with another.
This is different to checking for equality using equal-signs, because
the Enmaps may be different objects, but contain the same data.
DEPRECATION WARNING: WILL BE REMOVED IN ENMAP 6!

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: <code>boolean</code> - Whether the Enmaps have identical contents  

| Param | Type | Description |
| --- | --- | --- |
| enmap | [<code>Enmap</code>](#enmap-map) | Enmap to compare with |

<a name="Enmap+setProp"></a>

### ~~enmap.setProp(key, path, val) ⇒ [<code>Enmap</code>](#enmap-map)~~
***Deprecated***

Modify the property of a value inside the enmap, if the value is an object or array.
This is a shortcut to loading the key, changing the value, and setting it back.
DEPRECATION WARNING: WILL BE REMOVED IN ENMAP 6! Use set() instead!

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: [<code>Enmap</code>](#enmap-map) - The enmap.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Required. The key of the element to add to The Enmap or array. This value MUST be a string or number. |
| path | <code>string</code> | Required. The property to modify inside the value object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |
| val | <code>\*</code> | Required. The value to apply to the specified property. |

<a name="Enmap+pushIn"></a>

### ~~enmap.pushIn(key, path, val, allowDupes) ⇒ [<code>Enmap</code>](#enmap-map)~~
***Deprecated***

Push to an array element inside an Object or Array element in Enmap.
DEPRECATION WARNING: WILL BE REMOVED IN ENMAP 6! Use push() instead!

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: [<code>Enmap</code>](#enmap-map) - The enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | Required. The key of the element. This value MUST be a string or number. |
| path | <code>string</code> |  | Required. The name of the array property to push to. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |
| val | <code>\*</code> |  | Required. The value push to the array property. |
| allowDupes | <code>boolean</code> | <code>false</code> | Allow duplicate values in the array (default: false). |

<a name="Enmap+getProp"></a>

### ~~enmap.getProp(key, path) ⇒ <code>\*</code>~~
***Deprecated***

Returns the specific property within a stored value. If the key does not exist or the value is not an object, throws an error.
DEPRECATION WARNING: WILL BE REMOVED IN ENMAP 6! Use get() instead!

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: <code>\*</code> - The value of the property obtained.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Required. The key of the element to get from The Enmap. |
| path | <code>string</code> | Required. The property to retrieve from the object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

<a name="Enmap+deleteProp"></a>

### ~~enmap.deleteProp(key, path)~~
***Deprecated***

Delete a property from an object or array value in Enmap.
DEPRECATION WARNING: WILL BE REMOVED IN ENMAP 6! Use delete() instead!

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Required. The key of the element to delete the property from in Enmap. |
| path | <code>string</code> | Required. The name of the property to remove from the object. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

<a name="Enmap+removeFrom"></a>

### ~~enmap.removeFrom(key, path, val) ⇒ [<code>Enmap</code>](#enmap-map)~~
***Deprecated***

Remove a value from an Array or Object property inside an Array or Object element in Enmap.
Confusing? Sure is.
DEPRECATION WARNING: WILL BE REMOVED IN ENMAP 6! Use remove() instead!

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: [<code>Enmap</code>](#enmap-map) - The enmap.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Required. The key of the element. This value MUST be a string or number. |
| path | <code>string</code> | Required. The name of the array property to remove from. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |
| val | <code>\*</code> | Required. The value to remove from the array property. |

<a name="Enmap+hasProp"></a>

### ~~enmap.hasProp(key, path) ⇒ <code>boolean</code>~~
***Deprecated***

Returns whether or not the property exists within an object or array value in enmap.
DEPRECATION WARNING: WILL BE REMOVED IN ENMAP 6! Use has() instead!

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  
**Returns**: <code>boolean</code> - Whether the property exists.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Required. The key of the element to check in the Enmap or array. |
| path | <code>\*</code> | Required. The property to verify inside the value object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

<a name="Enmap+exists"></a>

### ~~enmap.exists(prop, value) ⇒ <code>boolean</code>~~
***Deprecated***

Searches for the existence of a single item where its specified property's value is identical to the given value
(`item[prop] === value`).
<warn>Do not use this to check for an item by its ID. Instead, use `enmap.has(id)`. See
[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has) for details.</warn>
DEPRECATION WARNING: WILL BE REMOVED IN ENMAP 6! Use has("key", "path") instead!

**Kind**: instance method of [<code>Enmap</code>](#enmap-map)  

| Param | Type | Description |
| --- | --- | --- |
| prop | <code>string</code> | The property to test against |
| value | <code>\*</code> | The expected value |

**Example**  
```js
if (enmap.exists('username', 'Bob')) {
 console.log('user here!');
}
```
<a name="Enmap.multi"></a>

### Enmap.multi(names, options) ⇒ <code>Object</code>
Initialize multiple Enmaps easily.

**Kind**: static method of [<code>Enmap</code>](#enmap-map)  
**Returns**: <code>Object</code> - An array of initialized Enmaps.  

| Param | Type | Description |
| --- | --- | --- |
| names | <code>Array.&lt;string&gt;</code> | Array of strings. Each array entry will create a separate enmap with that name. |
| options | <code>Object</code> | Options object to pass to each enmap, excluding the name.. |

**Example**  
```js
// Using local variables.
const Enmap = require('enmap');
const { settings, tags, blacklist } = Enmap.multi(['settings', 'tags', 'blacklist']);

// Attaching to an existing object (for instance some API's client)
const Enmap = require("enmap");
Object.assign(client, Enmap.multi(["settings", "tags", "blacklist"]));
```
