---
description: >-
  The complete and unadultered API documentation for every single method and
  property accessible in Enmap.
---

# Full Documentation

The following is the complete list of methods available in Enmap. As it is auto-generated from the source code and its comments, it's a little more "raw" than the Usage docs. However, it has the benefit of being more complete and usually more up to date than the manually written docs.

{% hint style="warning" %}
If you're doing a PR on the docs github, please do not manually edit the below contents, as it will be overwritten. Check the src/index.js source code and change the comments there instead!
{% endhint %}

<a name="enmap"></a>

### new Enmap([options])
Initializes a new Enmap, with options.


| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>Object</code> | Options for the enmap. See https://enmap.evie.codes/usage#enmap-options for details. |
| [options.name] | <code>string</code> | The name of the enmap. Represents its table name in sqlite. Unless inMemory is set to true, the enmap will be persisted to disk. |
| [options.dataDir] | <code>string</code> | Defaults to `./data`. Determines where the sqlite files will be stored. Can be relative (to your project root) or absolute on the disk. Windows users , remember to escape your backslashes! *Note*: Enmap will not automatically create the folder if it is set manually, so make sure it exists before starting your code! |
| [options.ensureProps] | <code>boolean</code> | defaults to `true`. If enabled and the value in the enmap is an object, using ensure() will also ensure that every property present in the default object will be added to the value, if it's absent. See ensure API reference for more information. |
| [options.autoEnsure] | <code>\*</code> | default is disabled. When provided a value, essentially runs ensure(key, autoEnsure) automatically so you don't have to. This is especially useful on get(), but will also apply on set(), and any array and object methods that interact with the database. |
| [options.serializer] | <code>function</code> | Optional. If a function is provided, it will execute on the data when it is written to the database. This is generally used to convert the value into a format that can be saved in the database, such as converting a complete class instance to just its ID. This function may return the value to be saved, or a promise that resolves to that value (in other words, can be an async function). |
| [options.deserializer] | <code>function</code> | Optional. If a function is provided, it will execute on the data when it is read from the database. This is generally used to convert the value from a stored ID into a more complex object. This function may return a value, or a promise that resolves to that value (in other words, can be an async function). |
| [options.inMemory] | <code>boolean</code> | Optional. If set to true, the enmap will be in-memory only, and will not write to disk. Useful for temporary stores. |
| [options.sqliteOptions] | <code>Object</code> | Optional. An object of options to pass to the better-sqlite3 Database constructor. |

**Example**  
```js
const Enmap = require("enmap");// Named, Persistent enmapconst myEnmap = new Enmap({ name: "testing" });// Memory-only enmapconst memoryEnmap = new Enmap({ inMemory: true });// Enmap that automatically assigns a default object when getting or setting anything.const autoEnmap = new Enmap({name: "settings", autoEnsure: { setting1: false, message: "default message"}})
```
<a name="Enmap+size"></a>

### enmap.size ⇒ <code>number</code>
Get the number of key/value pairs saved in the enmap.

**Kind**: instance property of <code>Enmap</code>  
**Returns**: <code>number</code> - The number of elements in the enmap.  
**Read only**: true  
<a name="Enmap+db"></a>

### enmap.db ⇒ <code>Database</code>
Get the better-sqlite3 database object. Useful if you want to directly query or interact with theunderlying SQLite database. Use at your own risk, as errors here might cause loss of data or corruption!

**Kind**: instance property of <code>Enmap</code>  
<a name="Enmap+autonum"></a>

### enmap.autonum ⇒ <code>number</code>
Generates an automatic numerical key for inserting a new value.This is a "weak" method, it ensures the value isn't duplicated, but does notguarantee it's sequential (if a value is deleted, another can take its place).Useful for logging, actions, items, etc - anything that doesn't already have a unique ID.

**Kind**: instance property of <code>Enmap</code>  
**Returns**: <code>number</code> - The generated key number.  
**Read only**: true  
**Example**  
```js
enmap.set(enmap.autonum, "This is a new value");
```
<a name="Enmap+set"></a>

### enmap.set(key, value, path)
Sets a value in Enmap. If the key already has a value, overwrites the data (or the value in a path, if provided).

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Required. The location in which the data should be saved. |
| value | <code>\*</code> | Required. The value to write. Values must be serializable, which is done through (better-serialize)[https://github.com/RealShadowNova/better-serialize] If the value is not directly serializable, please use a custom serializer/deserializer. |
| path | <code>string</code> | Optional. The path to the property to modify inside the value object or array. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |

**Example**  
```js
// Direct Value Examplesenmap.set('simplevalue', 'this is a string');enmap.set('isEnmapGreat', true);enmap.set('TheAnswer', 42);enmap.set('IhazObjects', { color: 'black', action: 'paint', desire: true });enmap.set('ArraysToo', [1, "two", "tree", "foor"])// Settings Propertiesenmap.set('IhazObjects', 'blue', 'color'); //modified previous objectenmap.set('ArraysToo', 'three', 2); // changes "tree" to "three" in array.
```
<a name="Enmap+update"></a>

### enmap.update(key, valueOrFunction) ⇒ <code>\*</code>
Update an existing object value in Enmap by merging new keys. **This only works on objects**, any other value will throw an error.Heavily inspired by setState from React's class components.This is very useful if you have many different values to update and don't want to have more than one .set(key, value, prop) lines.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>\*</code> - The modified (merged) value.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The key of the object to update. |
| valueOrFunction | <code>\*</code> | Either an object to merge with the existing value, or a function that provides the existing object and expects a new object as a return value. In the case of a straight value, the merge is recursive and will add any missing level. If using a function, it is your responsibility to merge the objects together correctly. |

**Example**  
```js
// Define an object we're going to updateenmap.set("obj", { a: 1, b: 2, c: 3 });// Direct mergeenmap.update("obj", { d: 4, e: 5 });// obj is now { a: 1, b: 2, c: 3, d: 4, e: 5 }// Functional updateenmap.update("obj", (previous) => ({  ...obj,  f: 6,  g: 7}));// this example takes heavy advantage of the spread operators.// More info: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
```
<a name="Enmap+get"></a>

### enmap.get(key, path) ⇒ <code>\*</code>
Retrieves a value from the enmap, using its key.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>\*</code> - The parsed value for this key.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The key to retrieve from the enmap. |
| path | <code>string</code> | Optional. The property to retrieve from the object or array. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |

**Example**  
```js
const myKeyValue = enmap.get("myKey");console.log(myKeyValue);const someSubValue = enmap.get("anObjectKey", "someprop.someOtherSubProp");
```
<a name="Enmap+observe"></a>

### enmap.observe(key, path) ⇒ <code>\*</code>
Returns an observable object. Modifying this object or any of its properties/indexes/childrenwill automatically save those changes into enmap. This only works onobjects and arrays, not "basic" values like strings or integers.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>\*</code> - The value for this key.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>\*</code> | The key to retrieve from the enmap. |
| path | <code>string</code> | Optional. The property to retrieve from the object or array. |

<a name="Enmap+keys"></a>

### enmap.keys() ⇒ <code>Array.&lt;string&gt;</code>
Get all the keys of the enmap as an array.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>Array.&lt;string&gt;</code> - An array of all the keys in the enmap.  
<a name="Enmap+values"></a>

### enmap.values() ⇒ <code>Array.&lt;\*&gt;</code>
Get all the values of the enmap as an array.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>Array.&lt;\*&gt;</code> - An array of all the values in the enmap.  
<a name="Enmap+entries"></a>

### enmap.entries() ⇒ <code>Array.&lt;Array.&lt;\*, \*&gt;&gt;</code>
Get all entries of the enmap as an array, with each item containing the key and value.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>Array.&lt;Array.&lt;\*, \*&gt;&gt;</code> - An array of arrays, with each sub-array containing two items, the key and the value.  
<a name="Enmap+push"></a>

### enmap.push(key, value, path, allowDupes)
Push to an array value in Enmap.

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | Required. The key of the array element to push to in Enmap. |
| value | <code>\*</code> |  | Required. The value to push to the array. |
| path | <code>string</code> |  | Optional. The path to the property to modify inside the value object or array. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |
| allowDupes | <code>boolean</code> | <code>false</code> | Optional. Allow duplicate values in the array (default: false). |

**Example**  
```js
// Assumingenmap.set("simpleArray", [1, 2, 3, 4]);enmap.set("arrayInObject", {sub: [1, 2, 3, 4]});enmap.push("simpleArray", 5); // adds 5 at the end of the arrayenmap.push("arrayInObject", "five", "sub"); // adds "five" at the end of the sub array
```
<a name="Enmap+math"></a>

### enmap.math(key, operation, operand, path) ⇒ <code>number</code>
Executes a mathematical operation on a value and saves it in the enmap.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>number</code> - The updated value after the operation  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The enmap key on which to execute the math operation. |
| operation | <code>string</code> | Which mathematical operation to execute. Supports most math ops: =, -, *, /, %, ^, and english spelling of those operations. |
| operand | <code>number</code> | The right operand of the operation. |
| path | <code>string</code> | Optional. The property path to execute the operation on, if the value is an object or array. |

**Example**  
```js
// Assumingpoints.set("number", 42);points.set("numberInObject", {sub: { anInt: 5 }});points.math("number", "/", 2); // 21points.math("number", "add", 5); // 26points.math("number", "modulo", 3); // 2points.math("numberInObject", "+", 10, "sub.anInt");
```
<a name="Enmap+inc"></a>

### enmap.inc(key, path) ⇒ <code>number</code>
Increments a key's value or property by 1. Value must be a number, or a path to a number.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>number</code> - The udpated value after incrementing.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The enmap key where the value to increment is stored. |
| path | <code>string</code> | Optional. The property path to increment, if the value is an object or array. |

**Example**  
```js
// Assumingpoints.set("number", 42);points.set("numberInObject", {sub: { anInt: 5 }});points.inc("number"); // 43points.inc("numberInObject", "sub.anInt"); // {sub: { anInt: 6 }}
```
<a name="Enmap+dec"></a>

### enmap.dec(key, path) ⇒ <code>Enmap</code>
Decrements a key's value or property by 1. Value must be a number, or a path to a number.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>Enmap</code> - The enmap.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The enmap key where the value to decrement is stored. |
| path | <code>string</code> | Optional. The property path to decrement, if the value is an object or array. |

**Example**  
```js
// Assumingpoints.set("number", 42);points.set("numberInObject", {sub: { anInt: 5 }});points.dec("number"); // 41points.dec("numberInObject", "sub.anInt"); // {sub: { anInt: 4 }}
```
<a name="Enmap+ensure"></a>

### enmap.ensure(key, defaultValue, path) ⇒ <code>\*</code>
Returns the key's value, or the default given, ensuring that the data is there.This is a shortcut to "if enmap doesn't have key, set it, then get it" which is a very common pattern.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>\*</code> - The value from the database for the key, or the default value provided for a new key.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Required. The key you want to make sure exists. |
| defaultValue | <code>\*</code> | Required. The value you want to save in the database and return as default. |
| path | <code>string</code> | Optional. If presents, ensures both the key exists as an object, and the full path exists. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |

**Example**  
```js
// Simply ensure the data exists (for using property methods):enmap.ensure("mykey", {some: "value", here: "as an example"});enmap.has("mykey"); // always returns trueenmap.get("mykey", "here") // returns "as an example";// Get the default value back in a variable:const settings = mySettings.ensure("1234567890", defaultSettings);console.log(settings) // enmap's value for "1234567890" if it exists, otherwise the defaultSettings value.
```
<a name="Enmap+has"></a>

### enmap.has(key, path) ⇒ <code>boolean</code>
Returns whether or not the key exists in the Enmap.

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Required. The key of the element to add to The Enmap or array. |
| path | <code>string</code> | Optional. The property to verify inside the value object or array. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |

**Example**  
```js
if(enmap.has("myKey")) {  // key is there}if(!enmap.has("myOtherKey", "oneProp.otherProp.SubProp")) return false;
```
<a name="Enmap+includes"></a>

### enmap.includes(key, value, path) ⇒ <code>boolean</code>
Performs Array.includes() on a certain enmap value. Works similar to[Array.includes()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes).

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>boolean</code> - Whether the array contains the value.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Required. The key of the array to check the value of. |
| value | <code>string</code> \| <code>number</code> | Required. The value to check whether it's in the array. |
| path | <code>string</code> | Optional. The property to access the array inside the value object or array. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |

<a name="Enmap+delete"></a>

### enmap.delete(key, path)
Deletes a key in the Enmap.

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Required. The key of the element to delete from The Enmap. |
| path | <code>string</code> | Optional. The name of the property to remove from the object. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |

<a name="Enmap+clear"></a>

### enmap.clear() ⇒ <code>void</code>
Deletes everything from the enmap.

**Kind**: instance method of <code>Enmap</code>  
<a name="Enmap+remove"></a>

### enmap.remove(key, val, path)
Remove a value in an Array or Object element in Enmap. Note that this only works forvalues, not keys. Note that only one value is removed, no more. Arrays of objects must use a function to remove,as full object matching is not supported.

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Required. The key of the element to remove from in Enmap. |
| val | <code>\*</code> \| <code>function</code> | Required. The value to remove from the array or object. OR a function to match an object. If using a function, the function provides the object value and must return a boolean that's true for the object you want to remove. |
| path | <code>string</code> | Optional. The name of the array property to remove from. Should be a path with dot notation, such as "prop1.subprop2.subprop3". If not presents, removes directly from the value. |

**Example**  
```js
// Assumingenmap.set('array', [1, 2, 3])enmap.set('objectarray', [{ a: 1, b: 2, c: 3 }, { d: 4, e: 5, f: 6 }])enmap.remove('array', 1); // value is now [2, 3]enmap.remove('objectarray', (value) => value.e === 5); // value is now [{ a: 1, b: 2, c: 3 }]
```
<a name="Enmap+export"></a>

### enmap.export() ⇒ <code>string</code>
Exports the enmap data to stringified JSON format.**__WARNING__**: Does not work on memory enmaps containing complex data!

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>string</code> - The enmap data in a stringified JSON format.  
<a name="Enmap+import"></a>

### enmap.import(data, overwrite, clear)
Import an existing json export from enmap. This data must have been exported from enmap,and must be from a version that's equivalent or lower than where you're importing it.(This means Enmap 5 data is compatible in Enmap 6).

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>string</code> |  | The data to import to Enmap. Must contain all the required fields provided by an enmap export(). |
| overwrite | <code>boolean</code> | <code>true</code> | Defaults to `true`. Whether to overwrite existing key/value data with incoming imported data |
| clear | <code>boolean</code> | <code>false</code> | Defaults to `false`. Whether to clear the enmap of all data before importing (**__WARNING__**: Any existing data will be lost! This cannot be undone.) |

<a name="Enmap+random"></a>

### enmap.random([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains random value(s) from this Enmap. This relies on [Enmap#array](Enmap#array).

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single value if `count` is undefined,or an array of values of `count` length  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [count] | <code>number</code> | <code>1</code> | Number of values to obtain randomly |

<a name="Enmap+randomKey"></a>

### enmap.randomKey([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains random key(s) from this Enmap. This relies on [Enmap#keyArray](Enmap#keyArray)

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single key if `count` is undefined,or an array of keys of `count` length  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [count] | <code>number</code> | <code>1</code> | Number of keys to obtain randomly |

<a name="Enmap+every"></a>

### enmap.every(valueOrFunction, [path]) ⇒ <code>boolean</code>
Similar to[Array.every()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every).Supports either a predicate function or a value to compare.Returns true only if the predicate function returns true for all elements in the array (or the value is strictly equal in all elements).

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| valueOrFunction | <code>function</code> \| <code>string</code> | Function used to test (should return a boolean), or a value to compare. |
| [path] | <code>string</code> | Required if the value is an object. The path to the property to compare with. |

<a name="Enmap+some"></a>

### enmap.some(valueOrFunction, [path]) ⇒ <code>Array</code>
Similar to[Array.some()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some).Supports either a predicate function or a value to compare.Returns true if the predicate function returns true for at least one element in the array (or the value is equal in at least one element).

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| valueOrFunction | <code>function</code> \| <code>string</code> | Function used to test (should return a boolean), or a value to compare. |
| [path] | <code>string</code> | Required if the value is an object. The path to the property to compare with. |

<a name="Enmap+map"></a>

### enmap.map(pathOrFn) ⇒ <code>Array</code>
Similar to[Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).Returns an array of the results of applying the callback to all elements.

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| pathOrFn | <code>function</code> \| <code>string</code> | A function that produces an element of the new Array, or a path to the property to map. |

<a name="Enmap+find"></a>

### enmap.find(pathOrFn, [value]) ⇒ <code>\*</code>
Searches for a single item where its specified property's value is identical to the given value(`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is similar to[Array.find()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find).

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| pathOrFn | <code>string</code> \| <code>function</code> | The path to the value to test against, or the function to test with |
| [value] | <code>\*</code> | The expected value - only applicable and required if using a property for the first argument |

**Example**  
```js
enmap.find('username', 'Bob');
```
**Example**  
```js
enmap.find(val => val.username === 'Bob');
```
<a name="Enmap+findIndex"></a>

### enmap.findIndex(pathOrFn, [value]) ⇒ <code>string</code> \| <code>number</code>
Searches for the key of a single item where its specified property's value is identical to the given value(`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is similar to[Array.findIndex()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex).

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| pathOrFn | <code>string</code> \| <code>function</code> | The path to the value to test against, or the function to test with |
| [value] | <code>\*</code> | The expected value - only applicable and required if using a property for the first argument |

**Example**  
```js
enmap.findIndex('username', 'Bob');
```
**Example**  
```js
enmap.findIndex(val => val.username === 'Bob');
```
<a name="Enmap+reduce"></a>

### enmap.reduce(predicate, [initialValue]) ⇒ <code>\*</code>
Similar to[Array.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce).

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| predicate | <code>function</code> | Function used to reduce, taking three arguments; `accumulator`, `currentValue`, `currentKey`. |
| [initialValue] | <code>\*</code> | Starting value for the accumulator |

<a name="Enmap+filter"></a>

### enmap.filter(pathOrFn, [value]) ⇒ <code>Enmap</code>
Similar to[Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).Returns an array of values where the given function returns true for that value.Alternatively you can provide a value and path to filter by using exact value matching.

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| pathOrFn | <code>function</code> | The path to the value to test against, or the function to test with. If using a function, this function should return a boolean. |
| [value] | <code>string</code> | Value to use as `this` when executing function |

<a name="Enmap+sweep"></a>

### enmap.sweep(pathOrFn, [value]) ⇒ <code>number</code>
Deletes entries that satisfy the provided filter function or value matching.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>number</code> - The number of removed entries.  

| Param | Type | Description |
| --- | --- | --- |
| pathOrFn | <code>function</code> \| <code>string</code> | The path to the value to test against, or the function to test with. |
| [value] | <code>\*</code> | The expected value - only applicable and required if using a property for the first argument. |

<a name="Enmap+changed"></a>

### enmap.changed(cb)
Function called whenever data changes within Enmap after the initial load.Can be used to detect if another part of your code changed a value in enmap and react on it.

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | A callback function that will be called whenever data changes in the enmap. |

**Example**  
```js
enmap.changed((keyName, oldValue, newValue) => {  console.log(`Value of ${keyName} has changed from: \n${oldValue}\nto\n${newValue}`);});
```
<a name="Enmap+partition"></a>

### enmap.partition(pathOrFn, value) ⇒ <code>Array.&lt;Array.&lt;\*&gt;&gt;</code>
Separates the Enmap into multiple arrays given a function that separates them.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>Array.&lt;Array.&lt;\*&gt;&gt;</code> - An array of arrays with the partitioned data.  

| Param | Type | Description |
| --- | --- | --- |
| pathOrFn | <code>\*</code> | the path to the value to test against, or the function to test with. |
| value | <code>\*</code> | the value to use as a condition for partitioning. |

<a name="Enmap.multi"></a>

### Enmap.multi(names, options) ⇒ <code>Object</code>
Initialize multiple Enmaps easily.

**Kind**: static method of <code>Enmap</code>  
**Returns**: <code>Object</code> - An array of initialized Enmaps.  

| Param | Type | Description |
| --- | --- | --- |
| names | <code>Array.&lt;string&gt;</code> | Array of strings. Each array entry will create a separate enmap with that name. |
| options | <code>Object</code> | Options object to pass to each enmap, excluding the name.. |

**Example**  
```js
// Using local variables.const Enmap = require('enmap');const { settings, tags, blacklist } = Enmap.multi(['settings', 'tags', 'blacklist']);// Attaching to an existing object (for instance some API's client)const Enmap = require("enmap");Object.assign(client, Enmap.multi(["settings", "tags", "blacklist"]));
```
