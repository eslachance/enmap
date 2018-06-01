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
* [Enmap-Rethink](https://www.npmjs.com/package/enmap-rethink) *Note: THE best for sharding: the only one that receives database updates on all shards (enmap-rethink 2.1.0 and higher)*
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
    * _instance_
        * [.fetchEverything()](#Enmap+fetchEverything) ⇒ <code>Map</code>
        * [.fetch(keyOrKeys)](#Enmap+fetch) ⇒ <code>\*</code> \| <code>Map</code>
        * [.autonum()](#Enmap+autonum) ⇒ <code>number</code>
        * [.changed(cb)](#Enmap+changed)
        * [.set(key, val)](#Enmap+set) ⇒ <code>Map</code>
        * [.setAsync(key, val)](#Enmap+setAsync) ⇒ <code>Promise.&lt;Map&gt;</code>
        * [.setProp(key, prop, val, save)](#Enmap+setProp) ⇒ <code>Map</code>
        * [.push(key, val, allowDupes)](#Enmap+push) ⇒ <code>Map</code>
        * [.pushIn(key, prop, val, allowDupes)](#Enmap+pushIn) ⇒ <code>Map</code>
        * [.get(key)](#Enmap+get) ⇒ <code>\*</code> \| <code>Promise.&lt;\*&gt;</code>
        * [.getProp(key, prop)](#Enmap+getProp) ⇒ <code>\*</code>
        * [.getHighestAutonum(start)](#Enmap+getHighestAutonum) ⇒ <code>Integer</code>
        * [.has(key)](#Enmap+has) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.hasProp(key, prop)](#Enmap+hasProp) ⇒ <code>boolean</code>
        * [.delete(key, bulk)](#Enmap+delete)
        * [.deleteAsync(key, bulk)](#Enmap+deleteAsync)
        * [.deleteAll(bulk)](#Enmap+deleteAll)
        * [.deleteAllAsync(bulk)](#Enmap+deleteAllAsync) ⇒ <code>Promise</code>
        * [.remove(key, val, allowDupes)](#Enmap+remove) ⇒ <code>Map</code>
        * [.removeFrom(key, prop, val)](#Enmap+removeFrom) ⇒ <code>Map</code>
        * [.deleteProp(key, prop)](#Enmap+deleteProp) ⇒ [<code>Promise.&lt;Enmap&gt;</code>](#Enmap) \| [<code>Enmap</code>](#Enmap)
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
        * [.equals(enmap)](#Enmap+equals) ⇒ <code>boolean</code>
    * _static_
        * [.multi(names, Provider, options)](#Enmap.multi) ⇒ <code>Array.&lt;Map&gt;</code>

<a name="Enmap+fetchEverything"></a>

### enmap.fetchEverything() ⇒ <code>Map</code>
Fetches every key from the persistent enmap and loads them into the current enmap value.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Map</code> - The enmap containing all values.  
<a name="Enmap+fetch"></a>

### enmap.fetch(keyOrKeys) ⇒ <code>\*</code> \| <code>Map</code>
Force fetch one or more key values from the enmap. If the database has changed, that new value is used.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>\*</code> \| <code>Map</code> - A single value if requested, or a non-persistent enmap of keys if an array is requested.  

| Param | Type | Description |
| --- | --- | --- |
| keyOrKeys | <code>string</code> \| <code>number</code> | A single key or array of keys to force fetch from the enmap database. |

<a name="Enmap+autonum"></a>

### enmap.autonum() ⇒ <code>number</code>
Generates an automatic numerical key for inserting a new value.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>number</code> - The generated key number.  
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
  console.log(`Value of ${key} has changed from: \n${oldValue}\nto\n${newValue});
});
```
<a name="Enmap+set"></a>

### enmap.set(key, val) ⇒ <code>Map</code>
Set the value in Enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Map</code> - The Enmap.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | Required. The key of the element to add to The Enmap.  If the Enmap is persistent this value MUST be a string or number. |
| val | <code>\*</code> | Required. The value of the element to add to The Enmap.  If the Enmap is persistent this value MUST be stringifiable as JSON. |

**Example**  
```js
enmap.set('simplevalue', 'this is a string');
enmap.set('isEnmapGreat', true);
enmap.set('TheAnswer', 42);
enmap.set('IhazObjects', { color: 'black', action: 'paint', desire: true });
```
<a name="Enmap+setAsync"></a>

### enmap.setAsync(key, val) ⇒ <code>Promise.&lt;Map&gt;</code>
Set the value in Enmap, but returns a promise that resolves once writte to the database.
Useless on non-persistent Enmaps.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Promise.&lt;Map&gt;</code> - The Enmap.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | Required. The key of the element to add to The Enmap.  If the Enmap is persistent this value MUST be a string or number. |
| val | <code>\*</code> | Required. The value of the element to add to The Enmap.  If the Enmap is persistent this value MUST be stringifiable as JSON. |

<a name="Enmap+setProp"></a>

### enmap.setProp(key, prop, val, save) ⇒ <code>Map</code>
Modify the property of a value inside the enmap, if the value is an object or array.
This is a shortcut to loading the key, changing the value, and setting it back.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Map</code> - The EnMap.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | Required. The key of the element to add to The Enmap or array.  This value MUST be a string or number. |
| prop | <code>\*</code> | Required. The property to modify inside the value object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |
| val | <code>\*</code> | Required. The value to apply to the specified property. |
| save | <code>boolean</code> | Optional. Whether to save to persistent DB (used as false in init) |

<a name="Enmap+push"></a>

### enmap.push(key, val, allowDupes) ⇒ <code>Map</code>
Push to an array value in Enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Map</code> - The EnMap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> \| <code>number</code> |  | Required. The key of the array element to push to in Enmap.  This value MUST be a string or number. |
| val | <code>\*</code> |  | Required. The value to push to the array. |
| allowDupes | <code>boolean</code> | <code>false</code> | Allow duplicate values in the array (default: false). |

<a name="Enmap+pushIn"></a>

### enmap.pushIn(key, prop, val, allowDupes) ⇒ <code>Map</code>
Push to an array element inside an Object or Array element in Enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Map</code> - The EnMap.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> \| <code>number</code> |  | Required. The key of the element.  This value MUST be a string or number. |
| prop | <code>\*</code> |  | Required. The name of the array property to push to. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |
| val | <code>\*</code> |  | Required. The value push to the array property. |
| allowDupes | <code>boolean</code> | <code>false</code> | Allow duplicate values in the array (default: false). |

<a name="Enmap+get"></a>

### enmap.get(key) ⇒ <code>\*</code> \| <code>Promise.&lt;\*&gt;</code>
Retrieves a key from the enmap. If fetchAll is false, returns a promise.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>\*</code> \| <code>Promise.&lt;\*&gt;</code> - The value or a promise containing the value.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | The key to retrieve from the enmap. |

**Example**  
```js
const myKeyValue = enmap.get("myKey");
console.log(myKeyValue);
```
<a name="Enmap+getProp"></a>

### enmap.getProp(key, prop) ⇒ <code>\*</code>
Returns the specific property within a stored value. If the key does not exist or the value is not an object, throws an error.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>\*</code> - The value of the property obtained.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | Required. The key of the element to get from The Enmap. |
| prop | <code>\*</code> | Required. The property to retrieve from the object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

<a name="Enmap+getHighestAutonum"></a>

### enmap.getHighestAutonum(start) ⇒ <code>Integer</code>
Internal method used by autonum().
Loops on incremental numerical values until it finds a free key
of that value in the Enamp.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Integer</code> - The first non-existant value found.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| start | <code>Integer</code> | <code>0</code> | The starting value to look for. |

<a name="Enmap+has"></a>

### enmap.has(key) ⇒ <code>Promise.&lt;boolean&gt;</code>
Returns whether or not the key exists in the Enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | Required. The key of the element to add to The Enmap or array.  This value MUST be a string or number. |

<a name="Enmap+hasProp"></a>

### enmap.hasProp(key, prop) ⇒ <code>boolean</code>
Returns whether or not the property exists within an object or array value in enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>boolean</code> - Whether the property exists.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | Required. The key of the element to check in the Enmap or array. |
| prop | <code>\*</code> | Required. The property to verify inside the value object or array. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

<a name="Enmap+delete"></a>

### enmap.delete(key, bulk)
Deletes a key in the Enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | Required. The key of the element to delete from The Enmap. |
| bulk | <code>boolean</code> | Internal property used by the purge method. |

<a name="Enmap+deleteAsync"></a>

### enmap.deleteAsync(key, bulk)
**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | Required. The key of the element to delete from The Enmap. |
| bulk | <code>boolean</code> | Internal property used by the purge method. |

<a name="Enmap+deleteAll"></a>

### enmap.deleteAll(bulk)
Calls the `delete()` method on all items that have it.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| bulk | <code>boolean</code> | <code>true</code> | Optional. Defaults to True. whether to use the provider's "bulk" delete feature if it has one. |

<a name="Enmap+deleteAllAsync"></a>

### enmap.deleteAllAsync(bulk) ⇒ <code>Promise</code>
Calls the `delete()` method on all items that have it.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Promise</code> - Returns a promise that is resolved when the database is cleared.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| bulk | <code>boolean</code> | <code>true</code> | Optional. Defaults to True. whether to use the provider's "bulk" delete feature if it has one. |

<a name="Enmap+remove"></a>

### enmap.remove(key, val, allowDupes) ⇒ <code>Map</code>
Remove a value in an Array or Object element in Enmap. Note that this only works for
values, not keys. Complex values such as objects and arrays will not be removed this way.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Map</code> - The EnMap.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | Required. The key of the element to remove from in Enmap.  This value MUST be a string or number. |
| val | <code>\*</code> | Required. The value to remove from the array or object. |
| allowDupes | <code>boolean</code> | Allow duplicate values in the array (default: false). |

<a name="Enmap+removeFrom"></a>

### enmap.removeFrom(key, prop, val) ⇒ <code>Map</code>
Remove a value from an Array or Object property inside an Array or Object element in Enmap.
Confusing? Sure is.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Map</code> - The EnMap.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | Required. The key of the element.  This value MUST be a string or number. |
| prop | <code>\*</code> | Required. The name of the array property to remove from. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |
| val | <code>\*</code> | Required. The value to remove from the array property. |

<a name="Enmap+deleteProp"></a>

### enmap.deleteProp(key, prop) ⇒ [<code>Promise.&lt;Enmap&gt;</code>](#Enmap) \| [<code>Enmap</code>](#Enmap)
Delete a property from an object or array value in Enmap.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
**Returns**: [<code>Promise.&lt;Enmap&gt;</code>](#Enmap) \| [<code>Enmap</code>](#Enmap) - If fetchAll is true, return the Enmap. Otherwise return a promise containing the Enmap.  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> \| <code>number</code> | Required. The key of the element to delete the property from in Enmap. |
| prop | <code>\*</code> | Required. The name of the property to remove from the object. Can be a path with dot notation, such as "prop1.subprop2.subprop3" |

<a name="Enmap+array"></a>

### enmap.array() ⇒ <code>Array</code>
Creates an ordered array of the values of this Enmap.
The array will only be reconstructed if an item is added to or removed from the Enmap,
or if you change the length of the array itself. If you don't want this caching behaviour, 
use `Array.from(enmap.values())` instead.

**Kind**: instance method of [<code>Enmap</code>](#Enmap)  
<a name="Enmap+keyArray"></a>

### enmap.keyArray() ⇒ <code>Array</code>
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

<a name="Enmap.multi"></a>

### Enmap.multi(names, Provider, options) ⇒ <code>Array.&lt;Map&gt;</code>
Initialize multiple Enmaps easily.

**Kind**: static method of [<code>Enmap</code>](#Enmap)  
**Returns**: <code>Array.&lt;Map&gt;</code> - An array of initialized Enmaps.  

| Param | Type | Description |
| --- | --- | --- |
| names | <code>Array.&lt;string&gt;</code> | Array of strings. Each array entry will create a separate enmap with that name. |
| Provider | <code>EnmapProvider</code> | Valid EnmapProvider object. |
| options | <code>Object</code> | Options object to pass to the provider. See provider documentation for its options. |

**Example**  
```js
// Using local variables and the mongodb provider.
const Enmap = require('enmap');
const Provider = require('enmap-mongo');
const { settings, tags, blacklist } = Enmap.multi(['settings', 'tags', 'blacklist'], Provider, { url: "some connection URL here" });

// Attaching to an existing object (for instance some API's client)
const Enmap = require("enmap");
const Provider = require("enmap-mongo");
Object.assign(client, Enmap.multi(["settings", "tags", "blacklist"], Provider, { url: "some connection URL here" }));
```
