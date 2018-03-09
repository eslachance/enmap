# Enmap - Enhanced Maps

Enhanced Maps are a data structure that can be used to store data in memory that can also be saved in a database behind the scenes. The data is synchronized to the database automatically, seamlessly, and asynchronously so it should not adversely affect your performance compared to using Maps for storage.

## FAQs

### Q: So what's Enmap

**A**: Enmaps are the Javascript Map() data structure with additional utility methods.

### Q: What is "Persistent"?

**A**: With the use of the optional providers modules, any data added to the Enmap
is stored not only in temporary memory but also backed up in a local database. 

### Q: How big can the Enmap be?

**A**: In its initial implementation, upon loading Enmap, all
key/value pairs are loaded in memory. The size of the memory used is directly
proportional to the size of your actual database. 

Future versions will have ways to load partial or temporary values, etc.

## Installation

To use Enmap, install it via NPM: 

```
npm i enmap
```

## Basic Usage

Inside your script, initialize a new Enmap: 

```js
const Enmap = require("enmap");

// Initialize an instance of Enmap
const myCollection = new Enmap();

// Adding data is simply a `set` command: 
myCollection.set("myKey", "a value");

// Getting a value is done by key 
let result = myCollection.get("myKey");
```

## Adding Persistence

Persistence requires an additional Provider module.

Official Enmap Providers: 

* [Enmap-SQLite](https://www.npmjs.com/package/enmap-sqlite) *Note: Against all odds, this provider DOES support sharding!*
* [Enmap-Rethink](https://www.npmjs.com/package/enmap-rethink) *Note: Obviously, supports sharding.*
* [Enmap-PGSQL](https://www.npmjs.com/package/enmap-pgsql) *Note: That's shorthand for "Postgresql". Supports sharding of course.*
* [Enmap-Mongo](https://www.npmjs.com/package/enmap-mongo) *Note: Yay, MongoDB! Supports sharding, duh.*
* [Enmap-Level](https://www.npmjs.com/package/enmap-level) *Note: LevelDB does not support multiple processes or shards!*

The following example uses Enmap-SQLite

```js
// Load Enmap
const Enmap = require('enmap');

// Load EnmapSQLite
const EnmapSQLite = require('enmap-sqlite');

// Initialize the sqlite database with a table named "test"
const provider = new EnmapSQLite({ name: 'test' });

// Initialize the Enmap with the provider instance.
const myColl = new Enmap({ provider: provider });

// Persistent providers load in an **async** fashion and provide a handy defer property:

myColl.defer.then(() => {
    // all data is loaded now.
    console.log(myColl.size + "keys loaded");
});

// You can also await it if your function is async: 
(async function() {
    await myColl.defer;
    console.log(myColl.size + "keys loaded");
    // Do stuff here!
}());

// Persistent collections should be **closed** before shutdown: 
await myColl.db.close(); // or level.close() works too!
```

## Using Enmap.multi() for multiple enmaps

To account for people that might use a large number of enmaps in the same project, I've created a new `multi()` method that can be used to instanciate multiple peristent enmaps together. 

The method takes 3 arguments: 
* An `array` of names for the enmaps to be created.
* A Provider (not instanciated), from any of the available ones.
* An `options` object containing any of the options needed to instanciate the provider. Do not add `name` to this, as it will use the names in the array instead.

The method returns an object where each property is a new fully-started Enmap that can be used as you would normally. 

Below, an example that uses destructuring to fit all in one nice line: 
```js
const Enmap = require('enmap');
const Provider = require('enmap-mongo');
const { settings, tags, blacklist, langs } = Enmap.multi(['settings', 'tags', 'blacklist', 'langs'], Provider, { url: "mongodb://localhost:27017/enmap" });
```

> Note that this uses a static method which means you should NOT call `new Enmap()` yourself, it's done within the method.

## Reading and Writing Data

Reading and writing data from an enmap is as simple as from a regular map. Note that the example uses a persistent enmap, but the set and get method will work for non-persistent enmaps too. Obviously though, those values won't be persistent through reboot if you don't give a provider.

```js
const Enmap = require('enmap');
const EnmapSQLite = require('enmap-sqlite');
// Oh look a shortcut to initializing ;)
const myColl = new Enmap({ provider: new EnmapSQLite({ name: 'test' }) });

(async function() {
    await myColl.defer;
    console.log(myColl.size + 'keys loaded');

    // Setting data is done with a key and value.
    myColl.set('simplevalue', 'this is a string');
    
    // enmap supports any **primitive** type.
    myColl.set('boolean', true);
    myColl.set('integer', 42);
    myColl.set('null', null);

    // enmap can retrieve items at any time
    const simplevalue = myColl.get('simplevalue'); // 'this is a string'
    const myboolean = myColl.get('boolean'); // true
    if(myColl.get('boolean')) console.log('yay!') // prints 'yay!' to the console.

    // You can **change** the value of a key by loading it, editing it,
    // then setting it **back** into enmap. There's no "update" function
    // it just overrides the data through the same set method: 
    myColl.set('someobject', {blah: "foo", thing: "amajig"});
    console.log(myColl.get('someobject')) // prints the object to console.

    const myObject = myColl.get('someobject'); // value is now the object with 2 properties.
    myObject.thing = "amabob"; // value of temporary object is now {blah: "foo", thing: "amabob"}
    myColl.set('someobject', myObject); // only now is it actually written correctly.
}());
```

> Because of how javascript works, doing something like `myColl.get('myobject').blah = 'meh'` actually works. HOWEVER that does *not* trigger persistence saves even though in memory it actually does change the enmap. "fixing" this would require some "monitor" on each value which is most definitely not the sort of overhead I want to add to this code. JavaScript wasn't built for that sort of thing in mind. 

## API Documentation

### Enmap ⇒ <code>Map</code>
A enhanced Map structure with additional utility methods.
Can be made persistent

**Kind**: global class  
**Extends**: <code>Map</code>  

* [Enmap](#Enmap) ⇐ <code>Map</code>
    * [.close()](#Enmap+close)
    * [.set(key, val, save)](#Enmap+set) ⇒ <code>Map</code>
    * [.getProp(key, prop)](#Enmap+getProp) ⇒ <code>\*</code>
    * [.setProp(key, prop, val, save)](#Enmap+setProp) ⇒ <code>Map</code>
    * [.hasProp(key, prop)](#Enmap+hasProp) ⇒ <code>boolean</code>
    * [.setAsync(key, val)](#Enmap+setAsync) ⇒ <code>Map</code>
    * [.delete(key, bulk)](#Enmap+delete)
    * [.deleteAsync(key, bulk)](#Enmap+deleteAsync)
    * [.array()](#Enmap+array) ⇒ <code>Array</code>
    * [.keyArray()](#Enmap+keyArray) ⇒ <code>Array</code>
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
    * [.deleteAll(bulk)](#Enmap+deleteAll)
    * [.deleteAllAsync(bulk)](#Enmap+deleteAllAsync)
    * [.equals(enmap)](#Enmap+equals) ⇒ <code>boolean</code>

<a name="Enmap+close"></a>

### enmap.close()
Shuts down the underlying persistent enmap database.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
<a name="Enmap+set"></a>

### enmap.set(key, val, save) ⇒ <code>Map</code>
**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Map</code> - The Enmap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>\*</code> |  | Required. The key of the element to add to The Enmap.  If the EnMap is persistent this value MUST be a string or number. |
| val | <code>\*</code> |  | Required. The value of the element to add to The Enmap.  If the EnMap is persistent this value MUST be stringifiable as JSON. |
| save | <code>boolean</code> | <code>true</code> | Optional. Whether to save to persistent DB (used as false in init) |

<a name="Enmap+getProp"></a>

### enmap.getProp(key, prop) ⇒ <code>\*</code>
Returns the specific property within a stored value. If the value isn't an object or array, returns the unchanged data
If the key does not exist or the value is not an object, throws an error.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>\*</code> - The value of the property obtained.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>\*</code> | Required. The key of the element to get from The Enmap. |
| prop | <code>\*</code> | Required. The property to retrieve from the object or array. |

<a name="Enmap+setProp"></a>

### enmap.setProp(key, prop, val, save) ⇒ <code>Map</code>
Modify the property of a value inside the enmap, assuming this value is an object or array.
This is a shortcut to loading the key, changing the value, and setting it back.
If the key does not exist or the value is not an object, throws an error.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Map</code> - The EnMap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>\*</code> |  | Required. The key of the element to add to The Enmap or array.  If the EnMap is persistent this value MUST be a string or number. |
| prop | <code>\*</code> |  | Required. The property to modify inside the value object or array. |
| val | <code>\*</code> |  | Required. The value to apply to the specified property. |
| save | <code>boolean</code> | <code>true</code> | Optional. Whether to save to persistent DB (used as false in init) |

<a name="Enmap+hasProp"></a>

### enmap.hasProp(key, prop) ⇒ <code>boolean</code>
Returns whether or not the property exists within an object or array value in enmap.
If the key does not exist or the value is not an object, throws an error.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>boolean</code> - Whether the property exists.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>\*</code> | Required. The key of the element to check in the Enmap or array. |
| prop | <code>\*</code> | Required. The property to verify inside the value object or array. |

<a name="Enmap+setAsync"></a>

### enmap.setAsync(key, val) ⇒ <code>Map</code>
**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Map</code> - The Enmap.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>\*</code> | Required. The key of the element to add to The Enmap.  If the EnMap is persistent this value MUST be a string or number. |
| val | <code>\*</code> | Required. The value of the element to add to The Enmap.  If the EnMap is persistent this value MUST be stringifiable as JSON. |

<a name="Enmap+delete"></a>

### enmap.delete(key, bulk)
**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>\*</code> | Required. The key of the element to delete from The Enmap. |
| bulk | <code>boolean</code> | Internal property used by the purge method. |

<a name="Enmap+deleteAsync"></a>

### enmap.deleteAsync(key, bulk)
**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>\*</code> | Required. The key of the element to delete from The Enmap. |
| bulk | <code>boolean</code> | Internal property used by the purge method. |

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

### enmap.deleteAll(bulk)
Calls the `delete()` method on all items that have it.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| bulk | <code>boolean</code> | <code>true</code> | Optional. Defaults to True. whether to use the provider's "bulk" delete feature if it has one. |

<a name="Enmap+deleteAllAsync"></a>

### enmap.deleteAllAsync(bulk)
Calls the `delete()` method on all items that have it.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| bulk | <code>boolean</code> | <code>true</code> | Optional. Defaults to True. whether to use the provider's "bulk" delete feature if it has one. |

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
