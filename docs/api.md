---
description: >-
  The complete and unadultered API documentation for every single method and
  property accessible in Enmap.
---

# Full Documentation

The following is the complete list of methods available in Enmap. As it is auto-generated from the source code and its comments, it's a little more "raw" than the Usage docs. However, it has the benefit of being more complete and usually more up to date than the manually written docs.

{% hint style="warning" %}
If you're doing a PR on the docs github, please do not manually edit the below contents, as it will be overwritten. Check the src/index.ts source code and change the comments there instead!
{% endhint %}

<a name="enmap"></a>

## Enmap Class

The Enmap class provides a simple, synchronous, fast key/value storage built around better-sqlite3.
Contains extra utility methods for managing arrays and objects.

## Properties

<dl>
<dt><a href="#size">size</a> ⇒ <code>number</code></dt>
<dd><p>Get the number of key/value pairs saved in the enmap.</p>
</dd>
<dt><a href="#db">db</a> ⇒ <code>Database</code></dt>
<dd><p>Get the better-sqlite3 database object. Useful if you want to directly query or interact with the
underlying SQLite database. Use at your own risk, as errors here might cause loss of data or corruption!</p>
</dd>
<dt><a href="#autonum">autonum</a> ⇒ <code>string</code></dt>
<dd><p>Generates an automatic numerical key for inserting a new value.
This is a &quot;weak&quot; method, it ensures the value isn&#39;t duplicated, but does not
guarantee it&#39;s sequential (if a value is deleted, another can take its place).
Useful for logging, actions, items, etc - anything that doesn&#39;t already have a unique ID.</p>
</dd>
</dl>

## Methods

<dl>
<dt><a href="#set">set(key, value, path)</a></dt>
<dd><p>Sets a value in Enmap. If the key already has a value, overwrites the data (or the value in a path, if provided).</p>
</dd>
<dt><a href="#get">get(key, path)</a> ⇒</dt>
<dd><p>Retrieves a value from the enmap, using its key.</p>
</dd>
<dt><a href="#has">has(key)</a> ⇒ <code>boolean</code></dt>
<dd><p>Returns whether or not the key exists in the Enmap.</p>
</dd>
<dt><a href="#delete">delete(key, path)</a></dt>
<dd><p>Deletes a key in the Enmap.</p>
</dd>
<dt><a href="#clear">clear()</a> ⇒ <code>void</code></dt>
<dd><p>Deletes everything from the enmap.</p>
</dd>
<dt><a href="#keys">keys()</a> ⇒ <code>Array.&lt;string&gt;</code></dt>
<dd><p>Get all the keys of the enmap as an array.</p>
</dd>
<dt><a href="#values">values()</a> ⇒ <code>Array.&lt;*&gt;</code></dt>
<dd><p>Get all the values of the enmap as an array.</p>
</dd>
<dt><a href="#entries">entries()</a> ⇒ <code>Array.&lt;Array.&lt;*, *&gt;&gt;</code></dt>
<dd><p>Get all entries of the enmap as an array, with each item containing the key and value.</p>
</dd>
<dt><a href="#update">update(key, valueOrFunction)</a> ⇒ <code>*</code></dt>
<dd><p>Update an existing object value in Enmap by merging new keys. <strong>This only works on objects</strong>, any other value will throw an error.
Heavily inspired by setState from React&#39;s class components.
This is very useful if you have many different values to update and don&#39;t want to have more than one .set(key, value, prop) lines.</p>
</dd>
<dt><a href="#observe">observe(key, path)</a> ⇒ <code>*</code></dt>
<dd><p>Returns an observable object. Modifying this object or any of its properties/indexes/children
will automatically save those changes into enmap. This only works on
objects and arrays, not &quot;basic&quot; values like strings or integers.</p>
</dd>
<dt><a href="#push">push(key, value, path, allowDupes)</a></dt>
<dd><p>Push to an array value in Enmap.</p>
</dd>
<dt><a href="#math">math(key, operation, operand, path)</a> ⇒ <code>number</code></dt>
<dd><p>Executes a mathematical operation on a value and saves it in the enmap.</p>
</dd>
<dt><a href="#inc">inc(key, path)</a> ⇒ <code>number</code></dt>
<dd><p>Increments a key&#39;s value or property by 1. Value must be a number, or a path to a number.</p>
</dd>
<dt><a href="#dec">dec(key, path)</a> ⇒ <code>Enmap</code></dt>
<dd><p>Decrements a key&#39;s value or property by 1. Value must be a number, or a path to a number.</p>
</dd>
<dt><a href="#ensure">ensure(key, defaultValue, path)</a> ⇒ <code>*</code></dt>
<dd><p>Returns the key&#39;s value, or the default given, ensuring that the data is there.
This is a shortcut to &quot;if enmap doesn&#39;t have key, set it, then get it&quot; which is a very common pattern.</p>
</dd>
<dt><a href="#includes">includes(key, value, path)</a> ⇒ <code>boolean</code></dt>
<dd><p>Performs Array.includes() on a certain enmap value. Works similar to
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes">Array.includes()</a>.</p>
</dd>
<dt><a href="#remove">remove(key, val, path)</a></dt>
<dd><p>Remove a value in an Array or Object element in Enmap. Note that this only works for
values, not keys. Note that only one value is removed, no more. Arrays of objects must use a function to remove,
as full object matching is not supported.</p>
</dd>
<dt><a href="#export">export()</a> ⇒ <code>string</code></dt>
<dd><p>Exports the enmap data to stringified JSON format.
<strong><strong>WARNING</strong></strong>: Does not work on memory enmaps containing complex data!</p>
</dd>
<dt><a href="#import">import(data, overwrite, clear)</a></dt>
<dd><p>Import an existing json export from enmap. This data must have been exported from enmap,
and must be from a version that&#39;s equivalent or lower than where you&#39;re importing it.
(This means Enmap 5 data is compatible in Enmap 6).</p>
</dd>
<dt><a href="#multi">multi(names, options)</a> ⇒ <code>Object</code></dt>
<dd><p>Initialize multiple Enmaps easily.</p>
</dd>
<dt><a href="#random">random([count])</a> ⇒ <code>*</code> | <code>Array.&lt;*&gt;</code></dt>
<dd><p>Obtains random value(s) from this Enmap. This relies on <a href="Enmap#array">Enmap#array</a>.</p>
</dd>
<dt><a href="#randomKey">randomKey([count])</a> ⇒ <code>*</code> | <code>Array.&lt;*&gt;</code></dt>
<dd><p>Obtains random key(s) from this Enmap. This relies on <a href="Enmap#keyArray">Enmap#keyArray</a></p>
</dd>
<dt><a href="#every">every(valueOrFunction, [path])</a> ⇒ <code>boolean</code></dt>
<dd><p>Similar to
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every">Array.every()</a>.
Supports either a predicate function or a value to compare.
Returns true only if the predicate function returns true for all elements in the array (or the value is strictly equal in all elements).</p>
</dd>
<dt><a href="#some">some(valueOrFunction, [path])</a> ⇒ <code>Array</code></dt>
<dd><p>Similar to
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some">Array.some()</a>.
Supports either a predicate function or a value to compare.
Returns true if the predicate function returns true for at least one element in the array (or the value is equal in at least one element).</p>
</dd>
<dt><a href="#map">map(pathOrFn)</a> ⇒ <code>Array</code></dt>
<dd><p>Similar to
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map">Array.map()</a>.
Returns an array of the results of applying the callback to all elements.</p>
</dd>
<dt><a href="#find">find(pathOrFn, [value])</a> ⇒ <code>*</code></dt>
<dd><p>Searches for a single item where its specified property&#39;s value is identical to the given value
(<code>item[prop] === value</code>), or the given function returns a truthy value. In the latter case, this is similar to
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find">Array.find()</a>.</p>
</dd>
<dt><a href="#findIndex">findIndex(pathOrFn, [value])</a> ⇒ <code>string</code> | <code>number</code></dt>
<dd><p>Searches for the key of a single item where its specified property&#39;s value is identical to the given value
(<code>item[prop] === value</code>), or the given function returns a truthy value. In the latter case, this is similar to
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex">Array.findIndex()</a>.</p>
</dd>
<dt><a href="#reduce">reduce(predicate, [initialValue])</a> ⇒ <code>*</code></dt>
<dd><p>Similar to
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce">Array.reduce()</a>.</p>
</dd>
<dt><a href="#filter">filter(pathOrFn, [value])</a> ⇒ <code>Enmap</code></dt>
<dd><p>Similar to
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter">Array.filter()</a>.
Returns an array of values where the given function returns true for that value.
Alternatively you can provide a value and path to filter by using exact value matching.</p>
</dd>
<dt><a href="#sweep">sweep(pathOrFn, [value])</a> ⇒ <code>number</code></dt>
<dd><p>Deletes entries that satisfy the provided filter function or value matching.</p>
</dd>
<dt><a href="#changed">changed(cb)</a></dt>
<dd><p>Function called whenever data changes within Enmap after the initial load.
Can be used to detect if another part of your code changed a value in enmap and react on it.</p>
</dd>
<dt><a href="#partition">partition(pathOrFn, value)</a> ⇒ <code>Array.&lt;Array.&lt;*&gt;&gt;</code></dt>
<dd><p>Separates the Enmap into multiple arrays given a function that separates them.</p>
</dd>
</dl>

<a name="size"></a>

## size ⇒ <code>number</code>
Get the number of key/value pairs saved in the enmap.

**Kind**: instance property of <code>Enmap</code>  
**Returns**: <code>number</code> - The number of elements in the enmap.  
**Read only**: true  
<a name="db"></a>

## db ⇒ <code>Database</code>
Get the better-sqlite3 database object. Useful if you want to directly query or interact with the
underlying SQLite database. Use at your own risk, as errors here might cause loss of data or corruption!

**Kind**: instance property of <code>Enmap</code>  
<a name="autonum"></a>

## autonum ⇒ <code>string</code>
Generates an automatic numerical key for inserting a new value.
This is a "weak" method, it ensures the value isn't duplicated, but does not
guarantee it's sequential (if a value is deleted, another can take its place).
Useful for logging, actions, items, etc - anything that doesn't already have a unique ID.

**Kind**: instance property of <code>Enmap</code>  
**Returns**: <code>string</code> - The generated key number.  
**Read only**: true  
**Example**  
```js
enmap.set(enmap.autonum, "This is a new value");
```
<a name="set"></a>

## set(key, value, path)
Sets a value in Enmap. If the key already has a value, overwrites the data (or the value in a path, if provided).

**Kind**: instance method of <code>Enmap</code>  

| Param | Description |
| --- | --- |
| key | Required. The location in which the data should be saved. |
| value | Required. The value to write. Values must be serializable, which is done through (better-serialize)[https://github.com/RealShadowNova/better-serialize] If the value is not directly serializable, please use a custom serializer/deserializer. |
| path | Optional. The path to the property to modify inside the value object or array. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |

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
<a name="get"></a>

## get(key, path) ⇒
Retrieves a value from the enmap, using its key.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: The parsed value for this key.  

| Param | Description |
| --- | --- |
| key | The key to retrieve from the enmap. |
| path | Optional. The property to retrieve from the object or array. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |

**Example**  
```js
const myKeyValue = enmap.get("myKey");
console.log(myKeyValue);

const someSubValue = enmap.get("anObjectKey", "someprop.someOtherSubProp");
```
<a name="has"></a>

## has(key) ⇒ <code>boolean</code>
Returns whether or not the key exists in the Enmap.

**Kind**: instance method of <code>Enmap</code>  

| Param | Description |
| --- | --- |
| key | Required. The key of the element to add to The Enmap or array. |

**Example**  
```js
if(enmap.has("myKey")) {
  // key is there
}
```
<a name="delete"></a>

## delete(key, path)
Deletes a key in the Enmap.

**Kind**: instance method of <code>Enmap</code>  

| Param | Description |
| --- | --- |
| key | Required. The key of the element to delete from The Enmap. |
| path | Optional. The name of the property to remove from the object. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |

<a name="clear"></a>

## clear() ⇒ <code>void</code>
Deletes everything from the enmap.

**Kind**: instance method of <code>Enmap</code>  
<a name="keys"></a>

## keys() ⇒ <code>Array.&lt;string&gt;</code>
Get all the keys of the enmap as an array.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>Array.&lt;string&gt;</code> - An array of all the keys in the enmap.  
<a name="values"></a>

## values() ⇒ <code>Array.&lt;\*&gt;</code>
Get all the values of the enmap as an array.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>Array.&lt;\*&gt;</code> - An array of all the values in the enmap.  
<a name="entries"></a>

## entries() ⇒ <code>Array.&lt;Array.&lt;\*, \*&gt;&gt;</code>
Get all entries of the enmap as an array, with each item containing the key and value.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>Array.&lt;Array.&lt;\*, \*&gt;&gt;</code> - An array of arrays, with each sub-array containing two items, the key and the value.  
<a name="update"></a>

## update(key, valueOrFunction) ⇒ <code>\*</code>
Update an existing object value in Enmap by merging new keys. **This only works on objects**, any other value will throw an error.
Heavily inspired by setState from React's class components.
This is very useful if you have many different values to update and don't want to have more than one .set(key, value, prop) lines.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>\*</code> - The modified (merged) value.  

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
<a name="observe"></a>

## observe(key, path) ⇒ <code>\*</code>
Returns an observable object. Modifying this object or any of its properties/indexes/children
will automatically save those changes into enmap. This only works on
objects and arrays, not "basic" values like strings or integers.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>\*</code> - The value for this key.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>\*</code> | The key to retrieve from the enmap. |
| path | <code>string</code> | Optional. The property to retrieve from the object or array. |

<a name="push"></a>

## push(key, value, path, allowDupes)
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
// Assuming
enmap.set("simpleArray", [1, 2, 3, 4]);
enmap.set("arrayInObject", {sub: [1, 2, 3, 4]});

enmap.push("simpleArray", 5); // adds 5 at the end of the array
enmap.push("arrayInObject", "five", "sub"); // adds "five" at the end of the sub array
```
<a name="math"></a>

## math(key, operation, operand, path) ⇒ <code>number</code>
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
// Assuming
points.set("number", 42);
points.set("numberInObject", {sub: { anInt: 5 }});

points.math("number", "/", 2); // 21
points.math("number", "add", 5); // 26
points.math("number", "modulo", 3); // 2
points.math("numberInObject", "+", 10, "sub.anInt");
```
<a name="inc"></a>

## inc(key, path) ⇒ <code>number</code>
Increments a key's value or property by 1. Value must be a number, or a path to a number.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>number</code> - The udpated value after incrementing.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The enmap key where the value to increment is stored. |
| path | <code>string</code> | Optional. The property path to increment, if the value is an object or array. |

**Example**  
```js
// Assuming
points.set("number", 42);
points.set("numberInObject", {sub: { anInt: 5 }});

points.inc("number"); // 43
points.inc("numberInObject", "sub.anInt"); // {sub: { anInt: 6 }}
```
<a name="dec"></a>

## dec(key, path) ⇒ <code>Enmap</code>
Decrements a key's value or property by 1. Value must be a number, or a path to a number.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>Enmap</code> - The enmap.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The enmap key where the value to decrement is stored. |
| path | <code>string</code> | Optional. The property path to decrement, if the value is an object or array. |

**Example**  
```js
// Assuming
points.set("number", 42);
points.set("numberInObject", {sub: { anInt: 5 }});

points.dec("number"); // 41
points.dec("numberInObject", "sub.anInt"); // {sub: { anInt: 4 }}
```
<a name="ensure"></a>

## ensure(key, defaultValue, path) ⇒ <code>\*</code>
Returns the key's value, or the default given, ensuring that the data is there.
This is a shortcut to "if enmap doesn't have key, set it, then get it" which is a very common pattern.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>\*</code> - The value from the database for the key, or the default value provided for a new key.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Required. The key you want to make sure exists. |
| defaultValue | <code>\*</code> | Required. The value you want to save in the database and return as default. |
| path | <code>string</code> | Optional. If presents, ensures both the key exists as an object, and the full path exists. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |

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
<a name="includes"></a>

## includes(key, value, path) ⇒ <code>boolean</code>
Performs Array.includes() on a certain enmap value. Works similar to
[Array.includes()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes).

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>boolean</code> - Whether the array contains the value.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Required. The key of the array to check the value of. |
| value | <code>string</code> \| <code>number</code> | Required. The value to check whether it's in the array. |
| path | <code>string</code> | Optional. The property to access the array inside the value object or array. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |

<a name="remove"></a>

## remove(key, val, path)
Remove a value in an Array or Object element in Enmap. Note that this only works for
values, not keys. Note that only one value is removed, no more. Arrays of objects must use a function to remove,
as full object matching is not supported.

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Required. The key of the element to remove from in Enmap. |
| val | <code>\*</code> \| <code>function</code> | Required. The value to remove from the array or object. OR a function to match an object. If using a function, the function provides the object value and must return a boolean that's true for the object you want to remove. |
| path | <code>string</code> | Optional. The name of the array property to remove from. Should be a path with dot notation, such as "prop1.subprop2.subprop3". If not presents, removes directly from the value. |

**Example**  
```js
// Assuming
enmap.set('array', [1, 2, 3])
enmap.set('objectarray', [{ a: 1, b: 2, c: 3 }, { d: 4, e: 5, f: 6 }])

enmap.remove('array', 1); // value is now [2, 3]
enmap.remove('objectarray', (value) => value.e === 5); // value is now [{ a: 1, b: 2, c: 3 }]
```
<a name="export"></a>

## export() ⇒ <code>string</code>
Exports the enmap data to stringified JSON format.
**__WARNING__**: Does not work on memory enmaps containing complex data!

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>string</code> - The enmap data in a stringified JSON format.  
<a name="import"></a>

## import(data, overwrite, clear)
Import an existing json export from enmap. This data must have been exported from enmap,
and must be from a version that's equivalent or lower than where you're importing it.
(This means Enmap 5 data is compatible in Enmap 6).

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>string</code> |  | The data to import to Enmap. Must contain all the required fields provided by an enmap export(). |
| overwrite | <code>boolean</code> | <code>true</code> | Defaults to `true`. Whether to overwrite existing key/value data with incoming imported data |
| clear | <code>boolean</code> | <code>false</code> | Defaults to `false`. Whether to clear the enmap of all data before importing (**__WARNING__**: Any existing data will be lost! This cannot be undone.) |

<a name="multi"></a>

## multi(names, options) ⇒ <code>Object</code>
Initialize multiple Enmaps easily.

**Kind**: instance method of <code>Enmap</code>  
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
import Enmap from 'enmap';
Object.assign(client, Enmap.multi(["settings", "tags", "blacklist"]));
```
<a name="random"></a>

## random([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains random value(s) from this Enmap. This relies on [Enmap#array](Enmap#array).

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single value if `count` is undefined,
or an array of values of `count` length  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [count] | <code>number</code> | <code>1</code> | Number of values to obtain randomly |

<a name="randomKey"></a>

## randomKey([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains random key(s) from this Enmap. This relies on [Enmap#keyArray](Enmap#keyArray)

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single key if `count` is undefined,
or an array of keys of `count` length  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [count] | <code>number</code> | <code>1</code> | Number of keys to obtain randomly |

<a name="every"></a>

## every(valueOrFunction, [path]) ⇒ <code>boolean</code>
Similar to
[Array.every()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every).
Supports either a predicate function or a value to compare.
Returns true only if the predicate function returns true for all elements in the array (or the value is strictly equal in all elements).

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| valueOrFunction | <code>function</code> \| <code>string</code> | Function used to test (should return a boolean), or a value to compare. |
| [path] | <code>string</code> | Required if the value is an object. The path to the property to compare with. |

<a name="some"></a>

## some(valueOrFunction, [path]) ⇒ <code>Array</code>
Similar to
[Array.some()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some).
Supports either a predicate function or a value to compare.
Returns true if the predicate function returns true for at least one element in the array (or the value is equal in at least one element).

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| valueOrFunction | <code>function</code> \| <code>string</code> | Function used to test (should return a boolean), or a value to compare. |
| [path] | <code>string</code> | Required if the value is an object. The path to the property to compare with. |

<a name="map"></a>

## map(pathOrFn) ⇒ <code>Array</code>
Similar to
[Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).
Returns an array of the results of applying the callback to all elements.

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| pathOrFn | <code>function</code> \| <code>string</code> | A function that produces an element of the new Array, or a path to the property to map. |

<a name="find"></a>

## find(pathOrFn, [value]) ⇒ <code>\*</code>
Searches for a single item where its specified property's value is identical to the given value
(`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is similar to
[Array.find()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find).

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
<a name="findIndex"></a>

## findIndex(pathOrFn, [value]) ⇒ <code>string</code> \| <code>number</code>
Searches for the key of a single item where its specified property's value is identical to the given value
(`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is similar to
[Array.findIndex()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex).

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
<a name="reduce"></a>

## reduce(predicate, [initialValue]) ⇒ <code>\*</code>
Similar to
[Array.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce).

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| predicate | <code>function</code> | Function used to reduce, taking three arguments; `accumulator`, `currentValue`, `currentKey`. |
| [initialValue] | <code>\*</code> | Starting value for the accumulator |

<a name="filter"></a>

## filter(pathOrFn, [value]) ⇒ <code>Enmap</code>
Similar to
[Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).
Returns an array of values where the given function returns true for that value.
Alternatively you can provide a value and path to filter by using exact value matching.

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| pathOrFn | <code>function</code> | The path to the value to test against, or the function to test with. If using a function, this function should return a boolean. |
| [value] | <code>string</code> | Value to use as `this` when executing function |

<a name="sweep"></a>

## sweep(pathOrFn, [value]) ⇒ <code>number</code>
Deletes entries that satisfy the provided filter function or value matching.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>number</code> - The number of removed entries.  

| Param | Type | Description |
| --- | --- | --- |
| pathOrFn | <code>function</code> \| <code>string</code> | The path to the value to test against, or the function to test with. |
| [value] | <code>\*</code> | The expected value - only applicable and required if using a property for the first argument. |

<a name="changed"></a>

## changed(cb)
Function called whenever data changes within Enmap after the initial load.
Can be used to detect if another part of your code changed a value in enmap and react on it.

**Kind**: instance method of <code>Enmap</code>  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>function</code> | A callback function that will be called whenever data changes in the enmap. |

**Example**  
```js
enmap.changed((keyName, oldValue, newValue) => {
  console.log(`Value of ${keyName} has changed from: \n${oldValue}\nto\n${newValue}`);
});
```
<a name="partition"></a>

## partition(pathOrFn, value) ⇒ <code>Array.&lt;Array.&lt;\*&gt;&gt;</code>
Separates the Enmap into multiple arrays given a function that separates them.

**Kind**: instance method of <code>Enmap</code>  
**Returns**: <code>Array.&lt;Array.&lt;\*&gt;&gt;</code> - An array of arrays with the partitioned data.  

| Param | Type | Description |
| --- | --- | --- |
| pathOrFn | <code>\*</code> | the path to the value to test against, or the function to test with. |
| value | <code>\*</code> | the value to use as a condition for partitioning. |

