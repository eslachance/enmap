<a name="Enmap"></a>

## Enmap ⇐ <code>Map</code>
A enhanced Map structure with additional utility methods.
Can be made persistent

**Kind**: global class  
**Extends**: <code>Map</code>  

* [Enmap](#Enmap) ⇐ <code>Map</code>
    * [new Enmap(iterable, options)](#new_Enmap_new)
    * _instance_
        * [.count](#Enmap+count) ⇒ <code>integer</code>
        * [.indexes](#Enmap+indexes) ⇒ <code>array.&lt;string&gt;</code>
        * [.autonum](#Enmap+autonum) ⇒ <code>number</code>
        * [.set(key, val, path)](#Enmap+set) ⇒ [<code>Enmap</code>](#Enmap)
        * [.get(key, path)](#Enmap+get) ⇒ <code>\*</code>
        * [.fetchEverything()](#Enmap+fetchEverything) ⇒ [<code>Enmap</code>](#Enmap)
        * [.fetch(keyOrKeys)](#Enmap+fetch) ⇒ [<code>Enmap</code>](#Enmap) \| <code>\*</code>
        * [.evict(keyOrArrayOfKeys)](#Enmap+evict) ⇒ [<code>Enmap</code>](#Enmap)
        * [.changed(cb)](#Enmap+changed)
        * [.close()](#Enmap+close) ⇒ <code>Promise.&lt;\*&gt;</code>
        * [.setProp(key, path, val)](#Enmap+setProp) ⇒ [<code>Enmap</code>](#Enmap)
        * [.push(key, val, path, allowDupes)](#Enmap+push) ⇒ [<code>Enmap</code>](#Enmap)
        * [.pushIn(key, path, val, allowDupes)](#Enmap+pushIn) ⇒ [<code>Enmap</code>](#Enmap)
        * [.math(key, operation, operand, path)](#Enmap+math) ⇒ [<code>Enmap</code>](#Enmap)
        * [.inc(key, path)](#Enmap+inc) ⇒ [<code>Enmap</code>](#Enmap)
        * [.dec(key, path)](#Enmap+dec) ⇒ [<code>Enmap</code>](#Enmap)
        * [.getProp(key, path)](#Enmap+getProp) ⇒ <code>\*</code>
        * [.ensure(key, defaultValue, path)](#Enmap+ensure) ⇒ <code>\*</code>
        * [.has(key, path)](#Enmap+has) ⇒ <code>boolean</code>
        * [.hasProp(key, path)](#Enmap+hasProp) ⇒ <code>boolean</code>
        * [.delete(key, path)](#Enmap+delete) ⇒ [<code>Enmap</code>](#Enmap)
        * [.deleteProp(key, path)](#Enmap+deleteProp)
        * [.deleteAll()](#Enmap+deleteAll)
        * [.destroy()](#Enmap+destroy) ⇒ <code>null</code>
        * [.remove(key, val, path)](#Enmap+remove) ⇒ [<code>Enmap</code>](#Enmap)
        * [.removeFrom(key, path, val)](#Enmap+removeFrom) ⇒ [<code>Enmap</code>](#Enmap)
        * [.array()](#Enmap+array) ⇒ <code>Array</code>
        * [.keyArray()](#Enmap+keyArray) ⇒ <code>Array.&lt;(string\|number)&gt;</code>
        * [.random([count])](#Enmap+random) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
        * [.randomKey([count])](#Enmap+randomKey) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
        * [.findAll(prop, value)](#Enmap+findAll) ⇒ <code>Array</code>
        * [.find(propOrFn, [value])](#Enmap+find) ⇒ <code>\*</code>
        * [.findKey(propOrFn, [value])](#Enmap+findKey) ⇒ <code>string</code> \| <code>number</code>
        * [.exists(prop, value)](#Enmap+exists) ⇒ <code>boolean</code>
        * [.sweep(fn, [thisArg])](#Enmap+sweep) ⇒ <code>number</code>
        * [.filter(fn, [thisArg])](#Enmap+filter) ⇒ [<code>Enmap</code>](#Enmap)
        * [.filterArray(fn, [thisArg])](#Enmap+filterArray) ⇒ <code>Array</code>
        * [.partition(fn, [thisArg])](#Enmap+partition) ⇒ <code>Array.&lt;Collection&gt;</code>
        * [.map(fn, [thisArg])](#Enmap+map) ⇒ <code>Array</code>
        * [.some(fn, [thisArg])](#Enmap+some) ⇒ <code>boolean</code>
        * [.every(fn, [thisArg])](#Enmap+every) ⇒ <code>boolean</code>
        * [.reduce(fn, [initialValue])](#Enmap+reduce) ⇒ <code>\*</code>
        * [.clone()](#Enmap+clone) ⇒ [<code>Enmap</code>](#Enmap)
        * [.concat(...enmaps)](#Enmap+concat) ⇒ [<code>Enmap</code>](#Enmap)
        * [.equals(enmap)](#Enmap+equals) ⇒ <code>boolean</code>
    * _static_
        * [.migrate()](#Enmap.migrate)
        * [.multi(names, options)](#Enmap.multi) ⇒ <code>Array.&lt;Map&gt;</code>

<a name="new_Enmap_new"></a>

### new Enmap(iterable, options)
Initializes a new Enmap, with options.


| Param | Type | Description |
| --- | --- | --- |
| iterable | <code>iterable</code> \| <code>string</code> | If iterable data, only valid in non-persistent enmaps. If this parameter is a string, it is assumed to be the enmap's name, which is a shorthand for adding a name in the options and making the enmap persistent. |
| options | <code>Object</code> | Additional options for the enmap. See https://enmap.evie.codes/usage#enmap-options for details. |
| options.name | <code>string</code> | The name of the enmap. Represents its table name in sqlite. If present, the enmap is persistent. If no name is given, the enmap is memory-only and is not saved in the database. As a shorthand, you may use a string for the name instead of the options (see example). |
| options.fetchAll | <code>boolean</code> | Defaults to `true`. When enabled, will automatically fetch any key that's requested using get, getProp, etc. This is a "syncroneous" operation, which means it doesn't need any of this promise or callback use. |
| options.dataDir | <code>string</code> | Defaults to `./data`. Determines where the sqlite files will be stored. Can be relative (to your project root) or absolute on the disk. Windows users , remember to escape your backslashes! |
| options.cloneLevel | <code>string</code> | Defaults to deep. Determines how objects and arrays are treated when inserting and retrieving from the database. See https://enmap.evie.codes/usage#enmap-options for more details on this option. |
| options.polling | <code>boolean</code> | defaults to `false`. Determines whether Enmap will attempt to retrieve changes from the database on a regular interval. This means that if another Enmap in another process modifies a value, this change will be reflected in ALL enmaps using the polling feature. |
| options.pollingInterval | <code>string</code> | defaults to `1000`, polling every second. Delay in milliseconds to poll new data from the database. The shorter the interval, the more CPU is used, so it's best not to lower this. Polling takes about 350-500ms if no data is found, and time will grow with more changes fetched. In my tests, 15 rows took a little more than 1 second, every second. |
| options.ensureProps | <code>boolean</code> | defaults to `false`. If enabled and the value in the enmap is an object, using ensure() will also ensure that every property present in the default object will be added to the value, if it's absent. See ensure API reference for more information. |
| options.strictType | <code>boolean</code> | defaults to `false`. If enabled, locks the enmap to the type of the first value written to it (such as Number or String or Object). Do not enable this option if your enmap contains different types of value or the enmap will fail to load. |
| options.typeLock | <code>string</code> | Only used if strictType is enabled. Defines an initial type for every value entered in the enmap. If no value is provided, the first value written to enmap will determine its typeLock. Must be a valid JS Primitive name, such as String, Number, Object, Array. |

<a name="Enmap+count"></a>

### enmap.count ⇒ <code>integer</code>
Retrieves the number of rows in the database for this enmap, even if they aren't fetched.

**Kind**: instance property of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>integer</code> - The number of rows in the database.  
<a name="Enmap+indexes"></a>

### enmap.indexes ⇒ <code>array.&lt;string&gt;</code>
Retrieves all the indexes (keys) in the database for this enmap, even if they aren't fetched.

**Kind**: instance property of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>array.&lt;string&gt;</code> - Array of all indexes (keys) in the enmap, cached or not.  
<a name="Enmap+autonum"></a>

### enmap.autonum ⇒ <code>number</code>
Generates an automatic numerical key for inserting a new value.
This is a "weak" method, it ensures the value isn't duplicated, but does not
guarantee it's sequential (if a value is deleted, another can take its place).
Useful for logging, but not much else.

**Kind**: instance property of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>number</code> - The generated key number.  
**Example**  
```js
enmap.set(enmap.autonum, "This is a new value");
```
<a name="Enmap+set"></a>

### enmap.set(key, val, path) ⇒ [<code>Enmap</code>](#Enmap)
Sets a value in Enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: [<code>Enmap</code>](#Enmap) - The enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> \| <code>number</code> |  | Required. The key of the element to add to The Enmap. |
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
enmap.set('IhazObjects', 'color', 'blue'); //modified previous object
enmap.set('ArraysToo', 2, 'three'); // changes "tree" to "three" in array.
```
<a name="Enmap+get"></a>

### enmap.get(key, path) ⇒ <code>\*</code>
Retrieves a key from the enmap. If fetchAll is false, returns a promise.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>\*</code> - The value for this key.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> \| <code>number</code> |  | The key to retrieve from the enmap. |
| path | <code>string</code> | <code>null</code> | Optional. The property to retrieve from the object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

**Example**  
```js
const myKeyValue = enmap.get("myKey");
console.log(myKeyValue);

const someSubValue = enmap.get("anObjectKey", "someprop.someOtherSubProp");
```
<a name="Enmap+fetchEverything"></a>

### enmap.fetchEverything() ⇒ [<code>Enmap</code>](#Enmap)
Fetches every key from the persistent enmap and loads them into the current enmap value.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: [<code>Enmap</code>](#Enmap) - The enmap containing all values.  
<a name="Enmap+fetch"></a>

### enmap.fetch(keyOrKeys) ⇒ [<code>Enmap</code>](#Enmap) \| <code>\*</code>
Force fetch one or more key values from the enmap. If the database has changed, that new value is used.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: [<code>Enmap</code>](#Enmap) \| <code>\*</code> - The Enmap, including the new fetched values, or the value in case the function argument is a single key.  

| Param | Type | Description |
| --- | --- | --- |
| keyOrKeys | <code>string</code> \| <code>number</code> \| <code>Array.&lt;(string\|number)&gt;</code> | A single key or array of keys to force fetch from the enmap database. |

<a name="Enmap+evict"></a>

### enmap.evict(keyOrArrayOfKeys) ⇒ [<code>Enmap</code>](#Enmap)
Removes a key or keys from the cache - useful when disabling autoFetch.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: [<code>Enmap</code>](#Enmap) - The enmap minus the evicted keys.  

| Param | Type | Description |
| --- | --- | --- |
| keyOrArrayOfKeys | <code>string</code> \| <code>number</code> \| <code>Array.&lt;(string\|number)&gt;</code> | A single key or array of keys to remove from the cache. |

<a name="Enmap+changed"></a>

### enmap.changed(cb)
Function called whenever data changes within Enmap after the initial load.
Can be used to detect if another part of your code changed a value in enmap and react on it.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | A callback function that will be called whenever data changes in the enmap. |

**Example**  
```js
enmap.changed((keyName, oldValue, newValue) => {
  console.log(`Value of ${keyName} has changed from: \n${oldValue}\nto\n${newValue});
});
```
<a name="Enmap+close"></a>

### enmap.close() ⇒ <code>Promise.&lt;\*&gt;</code>
Shuts down the database. WARNING: USING THIS MAKES THE ENMAP UNUSEABLE. You should
only use this method if you are closing your entire application.
Note that honestly I've never had to use this, shutting down the app without a close() is fine.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Promise.&lt;\*&gt;</code> - The promise of the database closing operation.  
<a name="Enmap+setProp"></a>

### enmap.setProp(key, path, val) ⇒ [<code>Enmap</code>](#Enmap)
Modify the property of a value inside the enmap, if the value is an object or array.
This is a shortcut to loading the key, changing the value, and setting it back.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: [<code>Enmap</code>](#Enmap) - The enmap.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | Required. The key of the element to add to The Enmap or array. This value MUST be a string or number. |
| path | <code>string</code> | Required. The property to modify inside the value object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |
| val | <code>\*</code> | Required. The value to apply to the specified property. |

<a name="Enmap+push"></a>

### enmap.push(key, val, path, allowDupes) ⇒ [<code>Enmap</code>](#Enmap)
Push to an array value in Enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: [<code>Enmap</code>](#Enmap) - The enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> \| <code>number</code> |  | Required. The key of the array element to push to in Enmap. This value MUST be a string or number. |
| val | <code>\*</code> |  | Required. The value to push to the array. |
| path | <code>string</code> | <code>null</code> | Optional. The path to the property to modify inside the value object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |
| allowDupes | <code>boolean</code> | <code>false</code> | Optional. Allow duplicate values in the array (default: false). |

**Example**  
```js
// Assuming
enmap.set("simpleArray", [1, 2, 3, 4]);
enmap.set("arrayInObject", {sub: [1, 2, 3, 4]});

enmap.push("simpleArray", 5); // adds 5 at the end of the array
enmap.push("arrayInObject", "five", "sub"); adds "five" at the end of the sub array
```
<a name="Enmap+pushIn"></a>

### enmap.pushIn(key, path, val, allowDupes) ⇒ [<code>Enmap</code>](#Enmap)
Push to an array element inside an Object or Array element in Enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: [<code>Enmap</code>](#Enmap) - The enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> \| <code>number</code> |  | Required. The key of the element. This value MUST be a string or number. |
| path | <code>string</code> |  | Required. The name of the array property to push to. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |
| val | <code>\*</code> |  | Required. The value push to the array property. |
| allowDupes | <code>boolean</code> | <code>false</code> | Allow duplicate values in the array (default: false). |

<a name="Enmap+math"></a>

### enmap.math(key, operation, operand, path) ⇒ [<code>Enmap</code>](#Enmap)
Executes a mathematical operation on a value and saves it in the enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: [<code>Enmap</code>](#Enmap) - The enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> \| <code>number</code> |  | The enmap key on which to execute the math operation. |
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

### enmap.inc(key, path) ⇒ [<code>Enmap</code>](#Enmap)
Increments a key's value or property by 1. Value must be a number, or a path to a number.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: [<code>Enmap</code>](#Enmap) - The enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> \| <code>number</code> |  | The enmap key where the value to increment is stored. |
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

### enmap.dec(key, path) ⇒ [<code>Enmap</code>](#Enmap)
Decrements a key's value or property by 1. Value must be a number, or a path to a number.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: [<code>Enmap</code>](#Enmap) - The enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> \| <code>number</code> |  | The enmap key where the value to decrement is stored. |
| path | <code>string</code> | <code>null</code> | Optional. The property path to decrement, if the value is an object or array. |

**Example**  
```js
// Assuming
points.set("number", 42);
points.set("numberInObject", {sub: { anInt: 5 }});

points.dec("number"); // 41
points.dec("numberInObject", "sub.anInt"); // {sub: { anInt: 4 }}
```
<a name="Enmap+getProp"></a>

### enmap.getProp(key, path) ⇒ <code>\*</code>
Returns the specific property within a stored value. If the key does not exist or the value is not an object, throws an error.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>\*</code> - The value of the property obtained.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | Required. The key of the element to get from The Enmap. |
| path | <code>string</code> | Required. The property to retrieve from the object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

<a name="Enmap+ensure"></a>

### enmap.ensure(key, defaultValue, path) ⇒ <code>\*</code>
Returns the key's value, or the default given, ensuring that the data is there.
This is a shortcut to "if enmap doesn't have key, set it, then get it" which is a very common pattern.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>\*</code> - The value from the database for the key, or the default value provided for a new key.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> \| <code>number</code> |  | Required. The key you want to make sure exists. |
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

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> \| <code>number</code> |  | Required. The key of the element to add to The Enmap or array. This value MUST be a string or number. |
| path | <code>string</code> | <code>null</code> | Optional. The property to verify inside the value object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

**Example**  
```js
if(enmap.has("myKey")) {
  // key is there
}

if(!enmap.has("myOtherKey", "oneProp.otherProp.SubProp")) return false;
```
<a name="Enmap+hasProp"></a>

### enmap.hasProp(key, path) ⇒ <code>boolean</code>
Returns whether or not the property exists within an object or array value in enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>boolean</code> - Whether the property exists.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | Required. The key of the element to check in the Enmap or array. |
| path | <code>\*</code> | Required. The property to verify inside the value object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

<a name="Enmap+delete"></a>

### enmap.delete(key, path) ⇒ [<code>Enmap</code>](#Enmap)
Deletes a key in the Enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: [<code>Enmap</code>](#Enmap) - The enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> \| <code>number</code> |  | Required. The key of the element to delete from The Enmap. |
| path | <code>string</code> | <code>null</code> | Optional. The name of the property to remove from the object. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

<a name="Enmap+deleteProp"></a>

### enmap.deleteProp(key, path)
Delete a property from an object or array value in Enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | Required. The key of the element to delete the property from in Enmap. |
| path | <code>string</code> | Required. The name of the property to remove from the object. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

<a name="Enmap+deleteAll"></a>

### enmap.deleteAll()
Deletes everything from the enmap. If persistent, clears the database of all its data for this table.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
<a name="Enmap+destroy"></a>

### enmap.destroy() ⇒ <code>null</code>
Completely destroys the entire enmap. This deletes the database tables entirely.
It will not affect other enmap data in the same database, however.
THIS ACTION WILL DESTROY YOUR DATA AND CANNOT BE UNDONE.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
<a name="Enmap+remove"></a>

### enmap.remove(key, val, path) ⇒ [<code>Enmap</code>](#Enmap)
Remove a value in an Array or Object element in Enmap. Note that this only works for
values, not keys. Complex values such as objects and arrays will not be removed this way.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: [<code>Enmap</code>](#Enmap) - The enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> \| <code>number</code> |  | Required. The key of the element to remove from in Enmap. This value MUST be a string or number. |
| val | <code>\*</code> |  | Required. The value to remove from the array or object. |
| path | <code>string</code> | <code>null</code> | Optional. The name of the array property to remove from. Can be a path with dot notation, such as "prop1.subprop2.subprop3". If not presents, removes directly from the value. |

<a name="Enmap+removeFrom"></a>

### enmap.removeFrom(key, path, val) ⇒ [<code>Enmap</code>](#Enmap)
Remove a value from an Array or Object property inside an Array or Object element in Enmap.
Confusing? Sure is.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: [<code>Enmap</code>](#Enmap) - The enmap.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | Required. The key of the element. This value MUST be a string or number. |
| path | <code>string</code> | Required. The name of the array property to remove from. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |
| val | <code>\*</code> | Required. The value to remove from the array property. |

<a name="Enmap+array"></a>

### enmap.array() ⇒ <code>Array</code>
Creates an ordered array of the values of this Enmap.
The array will only be reconstructed if an item is added to or removed from the Enmap,
or if you change the length of the array itself. If you don't want this caching behaviour,
use `Array.from(enmap.values())` instead.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
<a name="Enmap+keyArray"></a>

### enmap.keyArray() ⇒ <code>Array.&lt;(string\|number)&gt;</code>
Creates an ordered array of the keys of this Enmap
The array will only be reconstructed if an item is added to or removed from the Enmap,
or if you change the length of the array itself. If you don't want this caching behaviour,
use `Array.from(enmap.keys())` instead.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
<a name="Enmap+random"></a>

### enmap.random([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains random value(s) from this Enmap. This relies on [array](#Enmap+array).

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single value if `count` is undefined,
or an array of values of `count` length  

| Param | Type | Description |
| --- | --- | --- |
| [count] | <code>number</code> | Number of values to obtain randomly |

<a name="Enmap+randomKey"></a>

### enmap.randomKey([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains random key(s) from this Enmap. This relies on [keyArray](#Enmap+keyArray)

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single key if `count` is undefined,
or an array of keys of `count` length  

| Param | Type | Description |
| --- | --- | --- |
| [count] | <code>number</code> | Number of keys to obtain randomly |

<a name="Enmap+findAll"></a>

### enmap.findAll(prop, value) ⇒ <code>Array</code>
Searches for all items where their specified property's value is identical to the given value
(`item[prop] === value`).

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

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

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

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

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

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
<a name="Enmap+exists"></a>

### enmap.exists(prop, value) ⇒ <code>boolean</code>
Searches for the existence of a single item where its specified property's value is identical to the given value
(`item[prop] === value`).
<warn>Do not use this to check for an item by its ID. Instead, use `enmap.has(id)`. See
[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has) for details.</warn>

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

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
<a name="Enmap+sweep"></a>

### enmap.sweep(fn, [thisArg]) ⇒ <code>number</code>
Removes entries that satisfy the provided filter function.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>number</code> - The number of removed entries  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to test (should return a boolean) |
| [thisArg] | <code>Object</code> | Value to use as `this` when executing function |

<a name="Enmap+filter"></a>

### enmap.filter(fn, [thisArg]) ⇒ [<code>Enmap</code>](#Enmap)
Identical to
[Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter),
but returns a Enmap instead of an Array.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to test (should return a boolean) |
| [thisArg] | <code>Object</code> | Value to use as `this` when executing function |

<a name="Enmap+filterArray"></a>

### enmap.filterArray(fn, [thisArg]) ⇒ <code>Array</code>
Identical to
[Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to test (should return a boolean) |
| [thisArg] | <code>Object</code> | Value to use as `this` when executing function |

<a name="Enmap+partition"></a>

### enmap.partition(fn, [thisArg]) ⇒ <code>Array.&lt;Collection&gt;</code>
Partitions the collection into two collections where the first collection
contains the items that passed and the second contains the items that failed.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to test (should return a boolean) |
| [thisArg] | <code>\*</code> | Value to use as `this` when executing function |

**Example**  
```js
const [big, small] = collection.partition(guild => guild.memberCount > 250);
```
<a name="Enmap+map"></a>

### enmap.map(fn, [thisArg]) ⇒ <code>Array</code>
Identical to
[Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function that produces an element of the new array, taking three arguments |
| [thisArg] | <code>\*</code> | Value to use as `this` when executing function |

<a name="Enmap+some"></a>

### enmap.some(fn, [thisArg]) ⇒ <code>boolean</code>
Identical to
[Array.some()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some).

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to test (should return a boolean) |
| [thisArg] | <code>Object</code> | Value to use as `this` when executing function |

<a name="Enmap+every"></a>

### enmap.every(fn, [thisArg]) ⇒ <code>boolean</code>
Identical to
[Array.every()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every).

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to test (should return a boolean) |
| [thisArg] | <code>Object</code> | Value to use as `this` when executing function |

<a name="Enmap+reduce"></a>

### enmap.reduce(fn, [initialValue]) ⇒ <code>\*</code>
Identical to
[Array.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce).

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to reduce, taking four arguments; `accumulator`, `currentValue`, `currentKey`, and `enmap` |
| [initialValue] | <code>\*</code> | Starting value for the accumulator |

<a name="Enmap+clone"></a>

### enmap.clone() ⇒ [<code>Enmap</code>](#Enmap)
Creates an identical shallow copy of this Enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Example**  
```js
const newColl = someColl.clone();
```
<a name="Enmap+concat"></a>

### enmap.concat(...enmaps) ⇒ [<code>Enmap</code>](#Enmap)
Combines this Enmap with others into a new Enmap. None of the source Enmaps are modified.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Description |
| --- | --- | --- |
| ...enmaps | [<code>Enmap</code>](#Enmap) | Enmaps to merge |

**Example**  
```js
const newColl = someColl.concat(someOtherColl, anotherColl, ohBoyAColl);
```
<a name="Enmap+equals"></a>

### enmap.equals(enmap) ⇒ <code>boolean</code>
Checks if this Enmap shares identical key-value pairings with another.
This is different to checking for equality using equal-signs, because
the Enmaps may be different objects, but contain the same data.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>boolean</code> - Whether the Enmaps have identical contents  

| Param | Type | Description |
| --- | --- | --- |
| enmap | [<code>Enmap</code>](#Enmap) | Enmap to compare with |

<a name="Enmap.migrate"></a>

### Enmap.migrate()
Migrates an Enmap from version 3 or lower to a Version 4 enmap, which is locked to sqlite backend only.
This migration MUST be executed in version 3.1.4 of Enmap, along with appropriate providers.
See https://enmap.evie.codes/install/upgrade for more details.

**Kind**: static method of [<code>Enmap</code>](#Enmap)  
<a name="Enmap.multi"></a>

### Enmap.multi(names, options) ⇒ <code>Array.&lt;Map&gt;</code>
Initialize multiple Enmaps easily.

**Kind**: static method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Array.&lt;Map&gt;</code> - An array of initialized Enmaps.  

| Param | Type | Description |
| --- | --- | --- |
| names | <code>Array.&lt;string&gt;</code> | Array of strings. Each array entry will create a separate enmap with that name. |
| options | <code>Object</code> | Options object to pass to the provider. See provider documentation for its options. |

**Example**  
```js
// Using local variables and the mongodb provider.
const Enmap = require('enmap');
const { settings, tags, blacklist } = Enmap.multi(['settings', 'tags', 'blacklist']);

// Attaching to an existing object (for instance some API's client)
const Enmap = require("enmap");
Object.assign(client, Enmap.multi(["settings", "tags", "blacklist"]));
```
