# enmap
Enhanced Map structure with additional utility methods.

<a name="Collection"></a>

## Collection ⇐ <code>Map</code>
A enhanced Map structure with additional utility methods.
Can be made persistent

**Kind**: global class  
**Extends**: <code>Map</code>  

* [Collection](#Collection) ⇐ <code>Map</code>
    * [.init()](#Collection+init) ⇒ <code>Void</code>
    * [.validateName()](#Collection+validateName) ⇒ <code>boolean</code>
    * [.close()](#Collection+close)
    * [.set(key, val)](#Collection+set) ⇒ <code>Map</code>
    * [.delete(key, bulk)](#Collection+delete)
    * [.purge()](#Collection+purge) ⇒ <code>Promise</code>
    * [.array()](#Collection+array) ⇒ <code>Array</code>
    * [.keyArray()](#Collection+keyArray) ⇒ <code>Array</code>
    * [.first([count])](#Collection+first) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
    * [.firstKey([count])](#Collection+firstKey) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
    * [.last([count])](#Collection+last) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
    * [.lastKey([count])](#Collection+lastKey) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
    * [.random([count])](#Collection+random) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
    * [.randomKey([count])](#Collection+randomKey) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
    * [.findAll(prop, value)](#Collection+findAll) ⇒ <code>Array</code>
    * [.find(propOrFn, [value])](#Collection+find) ⇒ <code>\*</code>
    * [.findKey(propOrFn, [value])](#Collection+findKey) ⇒ <code>\*</code>
    * [.exists(prop, value)](#Collection+exists) ⇒ <code>boolean</code>
    * [.filter(fn, [thisArg])](#Collection+filter) ⇒ [<code>Collection</code>](#Collection)
    * [.filterArray(fn, [thisArg])](#Collection+filterArray) ⇒ <code>Array</code>
    * [.map(fn, [thisArg])](#Collection+map) ⇒ <code>Array</code>
    * [.some(fn, [thisArg])](#Collection+some) ⇒ <code>boolean</code>
    * [.every(fn, [thisArg])](#Collection+every) ⇒ <code>boolean</code>
    * [.reduce(fn, [initialValue])](#Collection+reduce) ⇒ <code>\*</code>
    * [.clone()](#Collection+clone) ⇒ [<code>Collection</code>](#Collection)
    * [.concat(...collections)](#Collection+concat) ⇒ [<code>Collection</code>](#Collection)
    * [.deleteAll()](#Collection+deleteAll) ⇒ <code>Array.&lt;Promise&gt;</code>
    * [.equals(collection)](#Collection+equals) ⇒ <code>boolean</code>
    * [.sort([compareFunction])](#Collection+sort) ⇒ [<code>Collection</code>](#Collection)

<a name="Collection+init"></a>

### collection.init() ⇒ <code>Void</code>
Internal method called on persistent Enmaps to load data from the underlying database.

**Kind**: instance method of [<code>Collection</code>](#Collection)  
<a name="Collection+validateName"></a>

### collection.validateName() ⇒ <code>boolean</code>
Internal method used to validate persistent enmap names (valid Windows filenames);

**Kind**: instance method of [<code>Collection</code>](#Collection)  
**Returns**: <code>boolean</code> - Indicates whether the name is valid.  
<a name="Collection+close"></a>

### collection.close()
Shuts down the underlying persistent enmap database.

**Kind**: instance method of [<code>Collection</code>](#Collection)  
<a name="Collection+set"></a>

### collection.set(key, val) ⇒ <code>Map</code>
**Kind**: instance method of [<code>Collection</code>](#Collection)  
**Returns**: <code>Map</code> - The EnMap object.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>\*</code> | Required. The key of the element to add to the EnMap object.  If the EnMap is persistent this value MUST be a string or number. |
| val | <code>\*</code> | Required. The value of the element to add to the EnMap object.  If the EnMap is persistent this value MUST be stringifiable as JSON. |

<a name="Collection+delete"></a>

### collection.delete(key, bulk)
**Kind**: instance method of [<code>Collection</code>](#Collection)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>\*</code> |  | Required. The key of the element to delete from the EnMap object. |
| bulk | <code>boolean</code> | <code>false</code> | Internal property used by the purge method. |

<a name="Collection+purge"></a>

### collection.purge() ⇒ <code>Promise</code>
Completely deletes all keys from an EnMap, including persistent data.

**Kind**: instance method of [<code>Collection</code>](#Collection)  
<a name="Collection+array"></a>

### collection.array() ⇒ <code>Array</code>
Creates an ordered array of the values of this collection, and caches it internally.
The array will only be reconstructed if an item is added to or removed from the collection, 
or if you change the length of the array itself. If you don't want this caching behaviour, 
use `Array.from(collection.values())` instead.

**Kind**: instance method of [<code>Collection</code>](#Collection)  
<a name="Collection+keyArray"></a>

### collection.keyArray() ⇒ <code>Array</code>
Creates an ordered array of the keys of this collection, and caches it internally. 
The array will only be reconstructed if an item is added to or removed from the collection, 
or if you change the length of the array itself. If you don't want this caching behaviour, 
use `Array.from(collection.keys())` instead.

**Kind**: instance method of [<code>Collection</code>](#Collection)  
<a name="Collection+first"></a>

### collection.first([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains the first value(s) in this collection.

**Kind**: instance method of [<code>Collection</code>](#Collection)  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single value if `count` is undefined, 
or an array of values of `count` length  

| Param | Type | Description |
| --- | --- | --- |
| [count] | <code>number</code> | Number of values to obtain from the beginning |

<a name="Collection+firstKey"></a>

### collection.firstKey([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains the first key(s) in this collection.

**Kind**: instance method of [<code>Collection</code>](#Collection)  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single key if `count` is undefined, 
or an array of keys of `count` length  

| Param | Type | Description |
| --- | --- | --- |
| [count] | <code>number</code> | Number of keys to obtain from the beginning |

<a name="Collection+last"></a>

### collection.last([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains the last value(s) in this collection. This relies on [array](#Collection+array), 
and thus the caching mechanism applies here as well.

**Kind**: instance method of [<code>Collection</code>](#Collection)  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single value if `count` is undefined, 
or an array of values of `count` length  

| Param | Type | Description |
| --- | --- | --- |
| [count] | <code>number</code> | Number of values to obtain from the end |

<a name="Collection+lastKey"></a>

### collection.lastKey([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains the last key(s) in this collection. This relies on [keyArray](#Collection+keyArray), 
and thus the caching mechanism applies here as well.

**Kind**: instance method of [<code>Collection</code>](#Collection)  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single key if `count` is undefined, 
or an array of keys of `count` length  

| Param | Type | Description |
| --- | --- | --- |
| [count] | <code>number</code> | Number of keys to obtain from the end |

<a name="Collection+random"></a>

### collection.random([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains random value(s) from this collection. This relies on [array](#Collection+array), 
and thus the caching mechanism applies here as well.

**Kind**: instance method of [<code>Collection</code>](#Collection)  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single value if `count` is undefined, 
or an array of values of `count` length  

| Param | Type | Description |
| --- | --- | --- |
| [count] | <code>number</code> | Number of values to obtain randomly |

<a name="Collection+randomKey"></a>

### collection.randomKey([count]) ⇒ <code>\*</code> \| <code>Array.&lt;\*&gt;</code>
Obtains random key(s) from this collection. This relies on [keyArray](#Collection+keyArray), 
and thus the caching mechanism applies here as well.

**Kind**: instance method of [<code>Collection</code>](#Collection)  
**Returns**: <code>\*</code> \| <code>Array.&lt;\*&gt;</code> - The single key if `count` is undefined, 
or an array of keys of `count` length  

| Param | Type | Description |
| --- | --- | --- |
| [count] | <code>number</code> | Number of keys to obtain randomly |

<a name="Collection+findAll"></a>

### collection.findAll(prop, value) ⇒ <code>Array</code>
Searches for all items where their specified property's value is identical to the given value
(`item[prop] === value`).

**Kind**: instance method of [<code>Collection</code>](#Collection)  

| Param | Type | Description |
| --- | --- | --- |
| prop | <code>string</code> | The property to test against |
| value | <code>\*</code> | The expected value |

**Example**  
```js
collection.findAll('username', 'Bob');
```
<a name="Collection+find"></a>

### collection.find(propOrFn, [value]) ⇒ <code>\*</code>
Searches for a single item where its specified property's value is identical to the given value
(`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is identical to
[Array.find()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find).
<warn>All collections used in Discord.js are mapped using their `id` property, and if you want to find by id you
should use the `get` method. See
[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get) for details.</warn>

**Kind**: instance method of [<code>Collection</code>](#Collection)  

| Param | Type | Description |
| --- | --- | --- |
| propOrFn | <code>string</code> \| <code>function</code> | The property to test against, or the function to test with |
| [value] | <code>\*</code> | The expected value - only applicable and required if using a property for the first argument |

**Example**  
```js
collection.find('username', 'Bob');
```
**Example**  
```js
collection.find(val => val.username === 'Bob');
```
<a name="Collection+findKey"></a>

### collection.findKey(propOrFn, [value]) ⇒ <code>\*</code>
Searches for the key of a single item where its specified property's value is identical to the given value
(`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is identical to
[Array.findIndex()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex).

**Kind**: instance method of [<code>Collection</code>](#Collection)  

| Param | Type | Description |
| --- | --- | --- |
| propOrFn | <code>string</code> \| <code>function</code> | The property to test against, or the function to test with |
| [value] | <code>\*</code> | The expected value - only applicable and required if using a property for the first argument |

**Example**  
```js
collection.findKey('username', 'Bob');
```
**Example**  
```js
collection.findKey(val => val.username === 'Bob');
```
<a name="Collection+exists"></a>

### collection.exists(prop, value) ⇒ <code>boolean</code>
Searches for the existence of a single item where its specified property's value is identical to the given value
(`item[prop] === value`).
<warn>Do not use this to check for an item by its ID. Instead, use `collection.has(id)`. See
[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has) for details.</warn>

**Kind**: instance method of [<code>Collection</code>](#Collection)  

| Param | Type | Description |
| --- | --- | --- |
| prop | <code>string</code> | The property to test against |
| value | <code>\*</code> | The expected value |

**Example**  
```js
if (collection.exists('username', 'Bob')) {
 console.log('user here!');
}
```
<a name="Collection+filter"></a>

### collection.filter(fn, [thisArg]) ⇒ [<code>Collection</code>](#Collection)
Identical to
[Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter),
but returns a Collection instead of an Array.

**Kind**: instance method of [<code>Collection</code>](#Collection)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to test (should return a boolean) |
| [thisArg] | <code>Object</code> | Value to use as `this` when executing function |

<a name="Collection+filterArray"></a>

### collection.filterArray(fn, [thisArg]) ⇒ <code>Array</code>
Identical to
[Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).

**Kind**: instance method of [<code>Collection</code>](#Collection)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to test (should return a boolean) |
| [thisArg] | <code>Object</code> | Value to use as `this` when executing function |

<a name="Collection+map"></a>

### collection.map(fn, [thisArg]) ⇒ <code>Array</code>
Identical to
[Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).

**Kind**: instance method of [<code>Collection</code>](#Collection)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function that produces an element of the new array, taking three arguments |
| [thisArg] | <code>\*</code> | Value to use as `this` when executing function |

<a name="Collection+some"></a>

### collection.some(fn, [thisArg]) ⇒ <code>boolean</code>
Identical to
[Array.some()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some).

**Kind**: instance method of [<code>Collection</code>](#Collection)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to test (should return a boolean) |
| [thisArg] | <code>Object</code> | Value to use as `this` when executing function |

<a name="Collection+every"></a>

### collection.every(fn, [thisArg]) ⇒ <code>boolean</code>
Identical to
[Array.every()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every).

**Kind**: instance method of [<code>Collection</code>](#Collection)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to test (should return a boolean) |
| [thisArg] | <code>Object</code> | Value to use as `this` when executing function |

<a name="Collection+reduce"></a>

### collection.reduce(fn, [initialValue]) ⇒ <code>\*</code>
Identical to
[Array.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce).

**Kind**: instance method of [<code>Collection</code>](#Collection)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> | Function used to reduce, taking four arguments; `accumulator`, `currentValue`, `currentKey`, and `collection` |
| [initialValue] | <code>\*</code> | Starting value for the accumulator |

<a name="Collection+clone"></a>

### collection.clone() ⇒ [<code>Collection</code>](#Collection)
Creates an identical shallow copy of this collection.

**Kind**: instance method of [<code>Collection</code>](#Collection)  
**Example**  
```js
const newColl = someColl.clone();
```
<a name="Collection+concat"></a>

### collection.concat(...collections) ⇒ [<code>Collection</code>](#Collection)
Combines this collection with others into a new collection. None of the source collections are modified.

**Kind**: instance method of [<code>Collection</code>](#Collection)  

| Param | Type | Description |
| --- | --- | --- |
| ...collections | [<code>Collection</code>](#Collection) | Collections to merge |

**Example**  
```js
const newColl = someColl.concat(someOtherColl, anotherColl, ohBoyAColl);
```
<a name="Collection+deleteAll"></a>

### collection.deleteAll() ⇒ <code>Array.&lt;Promise&gt;</code>
Calls the `delete()` method on all items that have it.

**Kind**: instance method of [<code>Collection</code>](#Collection)  
<a name="Collection+equals"></a>

### collection.equals(collection) ⇒ <code>boolean</code>
Checks if this collection shares identical key-value pairings with another.
This is different to checking for equality using equal-signs, because
the collections may be different objects, but contain the same data.

**Kind**: instance method of [<code>Collection</code>](#Collection)  
**Returns**: <code>boolean</code> - Whether the collections have identical contents  

| Param | Type | Description |
| --- | --- | --- |
| collection | [<code>Collection</code>](#Collection) | Collection to compare with |

<a name="Collection+sort"></a>

### collection.sort([compareFunction]) ⇒ [<code>Collection</code>](#Collection)
The sort() method sorts the elements of a collection in place and returns the collection.
The sort is not necessarily stable. The default sort order is according to string Unicode code points.

**Kind**: instance method of [<code>Collection</code>](#Collection)  

| Param | Type | Description |
| --- | --- | --- |
| [compareFunction] | <code>function</code> | Specifies a function that defines the sort order. if omitted, the collection is sorted according to each character's Unicode code point value, according to the string conversion of each element. |

