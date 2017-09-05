# Enmap - Enhanced Maps
<a name="Enmap"></a>

## Enmap ⇐ <code>Map</code>
Enhanced Map structure with additional utility methods.
Can be made persistent using an underlying `level` database.

**Kind**: global class  
**Extends**: <code>Map</code>  

* [Enmap](#Enmap) ⇐ <code>Map</code>
    * [.init()](#Enmap+init) ⇒ <code>Void</code>
    * [.validateName()](#Enmap+validateName) ⇒ <code>boolean</code>
    * [.close()](#Enmap+close)
    * [.set(key, val)](#Enmap+set) ⇒ <code>Map</code>
    * [.setAsync(key, val)](#Enmap+setAsync) ⇒ <code>Map</code>
    * [.delete(key, bulk)](#Enmap+delete)
    * [.deleteAsync(key, bulk)](#Enmap+deleteAsync)
    * [.purge()](#Enmap+purge) ⇒ <code>Promise</code>
    * [.array()](#Enmap+array) ⇒ <code>Array</code>
    * [.keyArray()](#Enmap+keyArray) ⇒ <code>Array</code>
    * [.first([count])](#Enmap+first) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
    * [.firstKey([count])](#Enmap+firstKey) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
    * [.last([count])](#Enmap+last) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
    * [.lastKey([count])](#Enmap+lastKey) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
    * [.random([count])](#Enmap+random) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
    * [.randomKey([count])](#Enmap+randomKey) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
    * [.findAll(prop, value)](#Enmap+findAll) ⇒ <code>Array</code>
    * [.find(propOrFn, [value])](#Enmap+find) ⇒ <code>\*</code>
    * [.exists(prop, value)](#Enmap+exists) ⇒ <code>boolean</code>
    * [.filter(fn, [thisArg])](#Enmap+filter) ⇒ [<code>Enmap</code>](#Enmap)
    * [.filterArray(fn, [thisArg])](#Enmap+filterArray) ⇒ <code>Array</code>
    * [.map(fn, [thisArg])](#Enmap+map) ⇒ <code>Array</code>
    * [.some(fn, [thisArg])](#Enmap+some) ⇒ <code>boolean</code>
    * [.every(fn, [thisArg])](#Enmap+every) ⇒ <code>boolean</code>
    * [.reduce(fn, [initialValue])](#Enmap+reduce) ⇒ <code>\*</code>
    * [.clone()](#Enmap+clone) ⇒ [<code>Enmap</code>](#Enmap)
    * [.concat(...enmaps)](#Enmap+concat) ⇒ [<code>Enmap</code>](#Enmap)
    * [.deleteAll()](#Enmap+deleteAll) ⇒ <code>Array.&lt;Promise&gt;</code>
    * [.equals(enmap)](#Enmap+equals) ⇒ <code>boolean</code>
    * [.sort([compareFunction])](#Enmap+sort) ⇒ [<code>Enmap</code>](#Enmap)

<a name="Enmap+init"></a>

### enmap.init() ⇒ <code>Void</code>
Internal method called on persistent Enmaps to load data from the underlying database.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
<a name="Enmap+validateName"></a>

### enmap.validateName() ⇒ <code>boolean</code>
Internal method used to validate persistent enmap names (valid Windows filenames);

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>boolean</code> - Indicates whether the name is valid.  
<a name="Enmap+close"></a>

### enmap.close()
Shuts down the underlying persistent enmap database.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
<a name="Enmap+set"></a>

### enmap.set(key, val) ⇒ <code>Map</code>
**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Map</code> - The EnMap object.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>\*</code> | Required. The key of the element to add to the EnMap object.  If the EnMap is persistent this value MUST be a string or number. |
| val | <code>\*</code> | Required. The value of the element to add to the EnMap object.  If the EnMap is persistent this value MUST be stringifiable as JSON. |

<a name="Enmap+setAsync"></a>

### enmap.setAsync(key, val) ⇒ <code>Map</code>
**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Map</code> - The EnMap object.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>\*</code> | Required. The key of the element to add to the EnMap object.  If the EnMap is persistent this value MUST be a string or number. |
| val | <code>\*</code> | Required. The value of the element to add to the EnMap object.  If the EnMap is persistent this value MUST be stringifiable as JSON. |

<a name="Enmap+delete"></a>

### enmap.delete(key, bulk)
**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>\*</code> |  | Required. The key of the element to delete from the EnMap object. |
| bulk | <code>boolean</code> | <code>false</code> | Internal property used by the purge method. |

<a name="Enmap+deleteAsync"></a>

### enmap.deleteAsync(key, bulk)
**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>\*</code> |  | Required. The key of the element to delete from the EnMap object. |
| bulk | <code>boolean</code> | <code>false</code> | Internal property used by the purge method. |

<a name="Enmap+purge"></a>

### enmap.purge() ⇒ <code>Promise</code>
Completely deletes all keys from an EnMap, including persistent data.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
<a name="Enmap+array"></a>

### enmap.array() ⇒ <code>Array</code>
Creates an ordered array of the values of this Enmap, and caches it internally.
The array will only be reconstructed if an item is added to or removed from the Enmap, 
or if you change the length of the array itself. If you don't want this caching behaviour, 
use `Array.from(enmap.values())` instead.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
<a name="Enmap+keyArray"></a>

### enmap.keyArray() ⇒ <code>Array</code>
Creates an ordered array of the keys of this Enmap, and caches it internally. 
The array will only be reconstructed if an item is added to or removed from the Enmap, 
or if you change the length of the array itself. If you don't want this caching behaviour, 
use `Array.from(enmap.keys())` instead.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
<a name="Enmap+first"></a>

### enmap.first([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains the first value(s) in this Enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single value if `count` is undefined, 
or an array of values of `count` length  

| Param | Type | Description |
| --- | --- | --- |
| [count] | <code>number</code> | Number of values to obtain from the beginning |

<a name="Enmap+firstKey"></a>

### enmap.firstKey([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains the first key(s) in this Enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single key if `count` is undefined, 
or an array of keys of `count` length  

| Param | Type | Description |
| --- | --- | --- |
| [count] | <code>number</code> | Number of keys to obtain from the beginning |

<a name="Enmap+last"></a>

### enmap.last([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains the last value(s) in this Enmap. This relies on [array](#Enmap+array), 
and thus the caching mechanism applies here as well.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single value if `count` is undefined, 
or an array of values of `count` length  

| Param | Type | Description |
| --- | --- | --- |
| [count] | <code>number</code> | Number of values to obtain from the end |

<a name="Enmap+lastKey"></a>

### enmap.lastKey([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains the last key(s) in this Enmap. This relies on [keyArray](#Enmap+keyArray), 
and thus the caching mechanism applies here as well.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single key if `count` is undefined, 
or an array of keys of `count` length  

| Param | Type | Description |
| --- | --- | --- |
| [count] | <code>number</code> | Number of keys to obtain from the end |

<a name="Enmap+random"></a>

### enmap.random([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains random value(s) from this Enmap. This relies on [array](#Enmap+array), 
and thus the caching mechanism applies here as well.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single value if `count` is undefined, 
or an array of values of `count` length  

| Param | Type | Description |
| --- | --- | --- |
| [count] | <code>number</code> | Number of values to obtain randomly |

<a name="Enmap+randomKey"></a>

### enmap.randomKey([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains random key(s) from this Enmap. This relies on [keyArray](#Enmap+keyArray), 
and thus the caching mechanism applies here as well.

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
<a name="Enmap+deleteAll"></a>

### enmap.deleteAll() ⇒ <code>Array.&lt;Promise&gt;</code>
Calls the `delete()` method on all items that have it.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
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

<a name="Enmap+sort"></a>

### enmap.sort([compareFunction]) ⇒ [<code>Enmap</code>](#Enmap)
The sort() method sorts the elements of a Enmap in place and returns the Enmap.
The sort is not necessarily stable. The default sort order is according to string Unicode code points.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Description |
| --- | --- | --- |
| [compareFunction] | <code>function</code> | Specifies a function that defines the sort order. if omitted, the Enmap is sorted according to each character's Unicode code point value, according to the string conversion of each element. |
