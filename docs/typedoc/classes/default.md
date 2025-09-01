[**Enmap API Reference v6.1.3**](../README.md)

***

[Enmap API Reference](../README.md) / default

# default (V, SV)

Defined in: [index.ts:77](https://github.com/eslachance/enmap/blob/main/src/index.ts#L77)

A simple, synchronous, fast key/value storage build around better-sqlite3.
Contains extra utility methods for managing arrays and objects.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `V` | `any` |
| `SV` | `unknown` |

## Constructors

### Constructor

```ts
new default<V, SV>(options): Enmap<V, SV>;
```

Defined in: [index.ts:109](https://github.com/eslachance/enmap/blob/main/src/index.ts#L109)

Initializes a new Enmap, with options.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`EnmapOptions`](../interfaces/EnmapOptions.md)<`V`, `SV`> | Options for the enmap. See https://enmap.alterion.dev/usage#enmap-options for details. |

#### Returns

`Enmap`<`V`, `SV`>

#### Example

```ts
import Enmap from 'enmap';
// Named, Persistent enmap
const myEnmap = new Enmap({ name: "testing" });

// Memory-only enmap
const memoryEnmap = new Enmap({ inMemory: true });

// Enmap that automatically assigns a default object when getting or setting anything.
const autoEnmap = new Enmap({name: "settings", autoEnsure: { setting1: false, message: "default message"}})
```

## Accessors

### size

#### Get Signature

```ts
get size(): number;
```

Defined in: [index.ts:292](https://github.com/eslachance/enmap/blob/main/src/index.ts#L292)

Get the number of key/value pairs saved in the enmap.

##### Returns

`number`

The number of elements in the enmap.

***

### count

#### Get Signature

```ts
get count(): number;
```

Defined in: [index.ts:300](https://github.com/eslachance/enmap/blob/main/src/index.ts#L300)

##### Returns

`number`

***

### length

#### Get Signature

```ts
get length(): number;
```

Defined in: [index.ts:304](https://github.com/eslachance/enmap/blob/main/src/index.ts#L304)

##### Returns

`number`

***

### db

#### Get Signature

```ts
get db(): Database;
```

Defined in: [index.ts:313](https://github.com/eslachance/enmap/blob/main/src/index.ts#L313)

Get the better-sqlite3 database object. Useful if you want to directly query or interact with the
underlying SQLite database. Use at your own risk, as errors here might cause loss of data or corruption!

##### Returns

`Database`

***

### autonum

#### Get Signature

```ts
get autonum(): string;
```

Defined in: [index.ts:327](https://github.com/eslachance/enmap/blob/main/src/index.ts#L327)

Generates an automatic numerical key for inserting a new value.
This is a "weak" method, it ensures the value isn't duplicated, but does not
guarantee it's sequential (if a value is deleted, another can take its place).
Useful for logging, actions, items, etc - anything that doesn't already have a unique ID.

##### Example

```ts
enmap.set(enmap.autonum, "This is a new value");
```

##### Returns

`string`

The generated key number.

## Methods

### set()

```ts
set(
   key, 
   value, 
   path?): this;
```

Defined in: [index.ts:195](https://github.com/eslachance/enmap/blob/main/src/index.ts#L195)

Sets a value in Enmap. If the key already has a value, overwrites the data (or the value in a path, if provided).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | Required. The location in which the data should be saved. |
| `value` | `any` | Required. The value to write. Values must be serializable, which is done through (better-serialize)[https://github.com/RealShadowNova/better-serialize] If the value is not directly serializable, please use a custom serializer/deserializer. |
| `path?` | `Path`<`V`, keyof `V`> | Optional. The path to the property to modify inside the value object or array. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |

#### Returns

`this`

#### Example

```ts
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

***

### get()

```ts
get(key, path?): any;
```

Defined in: [index.ts:221](https://github.com/eslachance/enmap/blob/main/src/index.ts#L221)

Retrieves a value from the enmap, using its key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to retrieve from the enmap. |
| `path?` | `Path`<`V`, keyof `V`> | Optional. The property to retrieve from the object or array. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |

#### Returns

`any`

The parsed value for this key.

#### Example

```ts
const myKeyValue = enmap.get("myKey");
console.log(myKeyValue);

const someSubValue = enmap.get("anObjectKey", "someprop.someOtherSubProp");
```

***

### has()

```ts
has(key): boolean;
```

Defined in: [index.ts:250](https://github.com/eslachance/enmap/blob/main/src/index.ts#L250)

Returns whether or not the key exists in the Enmap.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | Required. The key of the element to add to The Enmap or array. |

#### Returns

`boolean`

#### Example

```ts
if(enmap.has("myKey")) {
  // key is there
}
```

***

### delete()

```ts
delete(key, path?): this;
```

Defined in: [index.ts:263](https://github.com/eslachance/enmap/blob/main/src/index.ts#L263)

Deletes a key in the Enmap.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | Required. The key of the element to delete from The Enmap. |
| `path?` | `Path`<`V`, keyof `V`> | Optional. The name of the property to remove from the object. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |

#### Returns

`this`

***

### clear()

```ts
clear(): void;
```

Defined in: [index.ts:282](https://github.com/eslachance/enmap/blob/main/src/index.ts#L282)

Deletes everything from the enmap.

#### Returns

`void`

***

### keys()

```ts
keys(): string[];
```

Defined in: [index.ts:348](https://github.com/eslachance/enmap/blob/main/src/index.ts#L348)

Get all the keys of the enmap as an array.

#### Returns

`string`[]

An array of all the keys in the enmap.

***

### indexes()

```ts
indexes(): string[];
```

Defined in: [index.ts:357](https://github.com/eslachance/enmap/blob/main/src/index.ts#L357)

#### Returns

`string`[]

***

### values()

```ts
values(): V[];
```

Defined in: [index.ts:365](https://github.com/eslachance/enmap/blob/main/src/index.ts#L365)

Get all the values of the enmap as an array.

#### Returns

`V`[]

An array of all the values in the enmap.

***

### entries()

```ts
entries(): [string, V][];
```

Defined in: [index.ts:378](https://github.com/eslachance/enmap/blob/main/src/index.ts#L378)

Get all entries of the enmap as an array, with each item containing the key and value.

#### Returns

\[`string`, `V`\][]

An array of arrays, with each sub-array containing two items, the key and the value.

***

### update()

```ts
update(key, valueOrFunction): V;
```

Defined in: [index.ts:413](https://github.com/eslachance/enmap/blob/main/src/index.ts#L413)

Update an existing object value in Enmap by merging new keys. **This only works on objects**, any other value will throw an error.
Heavily inspired by setState from React's class components.
This is very useful if you have many different values to update and don't want to have more than one .set(key, value, prop) lines.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key of the object to update. |
| `valueOrFunction` | `Partial`<`V`> \| (`data`) => `V` | Either an object to merge with the existing value, or a function that provides the existing object and expects a new object as a return value. In the case of a straight value, the merge is recursive and will add any missing level. If using a function, it is your responsibility to merge the objects together correctly. |

#### Returns

`V`

The modified (merged) value.

#### Example

```ts
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

***

### observe()

```ts
observe(key, path?): any;
```

Defined in: [index.ts:433](https://github.com/eslachance/enmap/blob/main/src/index.ts#L433)

Returns an observable object. Modifying this object or any of its properties/indexes/children
will automatically save those changes into enmap. This only works on
objects and arrays, not "basic" values like strings or integers.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to retrieve from the enmap. |
| `path?` | `Path`<`V`, keyof `V`> | Optional. The property to retrieve from the object or array. |

#### Returns

`any`

The value for this key.

***

### push()

```ts
push(
   key, 
   value, 
   path?, 
   allowDupes?): this;
```

Defined in: [index.ts:457](https://github.com/eslachance/enmap/blob/main/src/index.ts#L457)

Push to an array value in Enmap.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `key` | `string` | `undefined` | Required. The key of the array element to push to in Enmap. |
| `value` | `V` | `undefined` | Required. The value to push to the array. |
| `path?` | `Path`<`V`, keyof `V`> | `undefined` | Optional. The path to the property to modify inside the value object or array. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |
| `allowDupes?` | `boolean` | `false` | Optional. Allow duplicate values in the array (default: false). |

#### Returns

`this`

#### Example

```ts
// Assuming
enmap.set("simpleArray", [1, 2, 3, 4]);
enmap.set("arrayInObject", {sub: [1, 2, 3, 4]});

enmap.push("simpleArray", 5); // adds 5 at the end of the array
enmap.push("arrayInObject", "five", "sub"); // adds "five" at the end of the sub array
```

***

### math()

```ts
math(
   key, 
   operation, 
   operand, 
   path?): null | number;
```

Defined in: [index.ts:487](https://github.com/eslachance/enmap/blob/main/src/index.ts#L487)

Executes a mathematical operation on a value and saves it in the enmap.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The enmap key on which to execute the math operation. |
| `operation` | `MathOps` | Which mathematical operation to execute. Supports most math ops: =, -, *, /, %, ^, and english spelling of those operations. |
| `operand` | `number` | The right operand of the operation. |
| `path?` | `Path`<`V`, keyof `V`> | Optional. The property path to execute the operation on, if the value is an object or array. |

#### Returns

`null` \| `number`

The updated value after the operation

#### Example

```ts
// Assuming
points.set("number", 42);
points.set("numberInObject", {sub: { anInt: 5 }});

points.math("number", "/", 2); // 21
points.math("number", "add", 5); // 26
points.math("number", "modulo", 3); // 2
points.math("numberInObject", "+", 10, "sub.anInt");
```

***

### inc()

```ts
inc(key, path?): this;
```

Defined in: [index.ts:512](https://github.com/eslachance/enmap/blob/main/src/index.ts#L512)

Increments a key's value or property by 1. Value must be a number, or a path to a number.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The enmap key where the value to increment is stored. |
| `path?` | `Path`<`V`, keyof `V`> | Optional. The property path to increment, if the value is an object or array. |

#### Returns

`this`

The udpated value after incrementing.

#### Example

```ts
// Assuming
points.set("number", 42);
points.set("numberInObject", {sub: { anInt: 5 }});

points.inc("number"); // 43
points.inc("numberInObject", "sub.anInt"); // {sub: { anInt: 6 }}
```

***

### dec()

```ts
dec(key, path?): this;
```

Defined in: [index.ts:533](https://github.com/eslachance/enmap/blob/main/src/index.ts#L533)

Decrements a key's value or property by 1. Value must be a number, or a path to a number.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The enmap key where the value to decrement is stored. |
| `path?` | `Path`<`V`, keyof `V`> | Optional. The property path to decrement, if the value is an object or array. |

#### Returns

`this`

The enmap.

#### Example

```ts
// Assuming
points.set("number", 42);
points.set("numberInObject", {sub: { anInt: 5 }});

points.dec("number"); // 41
points.dec("numberInObject", "sub.anInt"); // {sub: { anInt: 4 }}
```

***

### ensure()

```ts
ensure(
   key, 
   defaultValue, 
   path?): any;
```

Defined in: [index.ts:559](https://github.com/eslachance/enmap/blob/main/src/index.ts#L559)

Returns the key's value, or the default given, ensuring that the data is there.
This is a shortcut to "if enmap doesn't have key, set it, then get it" which is a very common pattern.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | Required. The key you want to make sure exists. |
| `defaultValue` | `any` | Required. The value you want to save in the database and return as default. |
| `path?` | `Path`<`V`, keyof `V`> | Optional. If presents, ensures both the key exists as an object, and the full path exists. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |

#### Returns

`any`

The value from the database for the key, or the default value provided for a new key.

#### Example

```ts
// Simply ensure the data exists (for using property methods):
enmap.ensure("mykey", {some: "value", here: "as an example"});
enmap.has("mykey"); // always returns true
enmap.get("mykey", "here") // returns "as an example";

// Get the default value back in a variable:
const settings = mySettings.ensure("1234567890", defaultSettings);
console.log(settings) // enmap's value for "1234567890" if it exists, otherwise the defaultSettings value.
```

***

### includes()

```ts
includes(
   key, 
   value, 
   path?): boolean;
```

Defined in: [index.ts:607](https://github.com/eslachance/enmap/blob/main/src/index.ts#L607)

Performs Array.includes() on a certain enmap value. Works similar to
[Array.includes()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | Required. The key of the array to check the value of. |
| `value` | `V` | Required. The value to check whether it's in the array. |
| `path?` | `Path`<`V`, keyof `V`> | Optional. The property to access the array inside the value object or array. Should be a path with dot notation, such as "prop1.subprop2.subprop3" |

#### Returns

`boolean`

Whether the array contains the value.

***

### remove()

```ts
remove(
   key, 
   val, 
   path?): this;
```

Defined in: [index.ts:632](https://github.com/eslachance/enmap/blob/main/src/index.ts#L632)

Remove a value in an Array or Object element in Enmap. Note that this only works for
values, not keys. Note that only one value is removed, no more. Arrays of objects must use a function to remove,
as full object matching is not supported.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | Required. The key of the element to remove from in Enmap. |
| `val` | `V` \| (`value`) => `boolean` | Required. The value to remove from the array or object. OR a function to match an object. If using a function, the function provides the object value and must return a boolean that's true for the object you want to remove. |
| `path?` | `Path`<`V`, keyof `V`> | Optional. The name of the array property to remove from. Should be a path with dot notation, such as "prop1.subprop2.subprop3". If not presents, removes directly from the value. |

#### Returns

`this`

#### Example

```ts
// Assuming
enmap.set('array', [1, 2, 3])
enmap.set('objectarray', [{ a: 1, b: 2, c: 3 }, { d: 4, e: 5, f: 6 }])

enmap.remove('array', 1); // value is now [2, 3]
enmap.remove('objectarray', (value) => value.e === 5); // value is now [{ a: 1, b: 2, c: 3 }]
```

***

### export()

```ts
export(): string;
```

Defined in: [index.ts:650](https://github.com/eslachance/enmap/blob/main/src/index.ts#L650)

Exports the enmap data to stringified JSON format.
**__WARNING__**: Does not work on memory enmaps containing complex data!

#### Returns

`string`

The enmap data in a stringified JSON format.

***

### import()

```ts
import(
   data, 
   overwrite, 
   clear): this;
```

Defined in: [index.ts:673](https://github.com/eslachance/enmap/blob/main/src/index.ts#L673)

Import an existing json export from enmap. This data must have been exported from enmap,
and must be from a version that's equivalent or lower than where you're importing it.
(This means Enmap 5 data is compatible in Enmap 6).

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `data` | `string` | `undefined` | The data to import to Enmap. Must contain all the required fields provided by an enmap export(). |
| `overwrite` | `boolean` | `true` | Defaults to `true`. Whether to overwrite existing key/value data with incoming imported data |
| `clear` | `boolean` | `false` | Defaults to `false`. Whether to clear the enmap of all data before importing (**__WARNING__**: Any existing data will be lost! This cannot be undone.) |

#### Returns

`this`

***

### multi()

```ts
static multi<V, SV>(names, options?): Record<string, Enmap<V, SV>>;
```

Defined in: [index.ts:715](https://github.com/eslachance/enmap/blob/main/src/index.ts#L715)

Initialize multiple Enmaps easily.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `V` | `unknown` |
| `SV` | `unknown` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `names` | `string`[] | Array of strings. Each array entry will create a separate enmap with that name. |
| `options?` | `Omit`<[`EnmapOptions`](../interfaces/EnmapOptions.md)\<`V`, `SV`>, `"name"`\> | Options object to pass to each enmap, excluding the name.. |

#### Returns

`Record`<`string`, `Enmap`\<`V`, `SV`>\>

An array of initialized Enmaps.

#### Example

```ts
// Using local variables.
const Enmap = require('enmap');
const { settings, tags, blacklist } = Enmap.multi(['settings', 'tags', 'blacklist']);

// Attaching to an existing object (for instance some API's client)
import Enmap from 'enmap';
Object.assign(client, Enmap.multi(["settings", "tags", "blacklist"]));
```

***

### random()

```ts
random(count?): [string, V][];
```

Defined in: [index.ts:738](https://github.com/eslachance/enmap/blob/main/src/index.ts#L738)

Obtains random value(s) from this Enmap. This relies on Enmap#array.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `count?` | `number` | `1` | Number of values to obtain randomly |

#### Returns

\[`string`, `V`\][]

The single value if `count` is undefined,
or an array of values of `count` length

***

### randomKey()

```ts
randomKey(count?): string[];
```

Defined in: [index.ts:755](https://github.com/eslachance/enmap/blob/main/src/index.ts#L755)

Obtains random key(s) from this Enmap. This relies on Enmap#keyArray

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `count?` | `number` | `1` | Number of keys to obtain randomly |

#### Returns

`string`[]

The single key if `count` is undefined,
or an array of keys of `count` length

***

### every()

```ts
every(valueOrFunction, path?): boolean;
```

Defined in: [index.ts:775](https://github.com/eslachance/enmap/blob/main/src/index.ts#L775)

Similar to
[Array.every()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every).
Supports either a predicate function or a value to compare.
Returns true only if the predicate function returns true for all elements in the array (or the value is strictly equal in all elements).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `valueOrFunction` | `any` | Function used to test (should return a boolean), or a value to compare. |
| `path?` | `Path`<`V`, keyof `V`> | Required if the value is an object. The path to the property to compare with. |

#### Returns

`boolean`

***

### some()

```ts
some(valueOrFunction, path?): boolean;
```

Defined in: [index.ts:802](https://github.com/eslachance/enmap/blob/main/src/index.ts#L802)

Similar to
[Array.some()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some).
Supports either a predicate function or a value to compare.
Returns true if the predicate function returns true for at least one element in the array (or the value is equal in at least one element).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `valueOrFunction` | `any` | Function used to test (should return a boolean), or a value to compare. |
| `path?` | `Path`<`V`, keyof `V`> | Required if the value is an object. The path to the property to compare with. |

#### Returns

`boolean`

***

### map()

```ts
map<R>(pathOrFn): R[];
```

Defined in: [index.ts:827](https://github.com/eslachance/enmap/blob/main/src/index.ts#L827)

Similar to
[Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).
Returns an array of the results of applying the callback to all elements.

#### Type Parameters

| Type Parameter |
| ------ |
| `R` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pathOrFn` | `string` \| (`val`, `key`) => `R` | A function that produces an element of the new Array, or a path to the property to map. |

#### Returns

`R`[]

***

### find()

```ts
find(pathOrFn, value?): null | V;
```

Defined in: [index.ts:853](https://github.com/eslachance/enmap/blob/main/src/index.ts#L853)

Searches for a single item where its specified property's value is identical to the given value
(`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is similar to
[Array.find()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pathOrFn` | `string` \| (`val`, `key`) => `boolean` | The path to the value to test against, or the function to test with |
| `value?` | `any` | The expected value - only applicable and required if using a property for the first argument |

#### Returns

`null` \| `V`

#### Examples

```ts
enmap.find('username', 'Bob');
```

```ts
enmap.find(val => val.username === 'Bob');
```

***

### findIndex()

```ts
findIndex(pathOrFn, value?): null | string;
```

Defined in: [index.ts:879](https://github.com/eslachance/enmap/blob/main/src/index.ts#L879)

Searches for the key of a single item where its specified property's value is identical to the given value
(`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is similar to
[Array.findIndex()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pathOrFn` | `string` \| (`val`, `key`) => `boolean` | The path to the value to test against, or the function to test with |
| `value?` | `any` | The expected value - only applicable and required if using a property for the first argument |

#### Returns

`null` \| `string`

#### Examples

```ts
enmap.findIndex('username', 'Bob');
```

```ts
enmap.findIndex(val => val.username === 'Bob');
```

***

### reduce()

```ts
reduce<R>(predicate, initialValue?): R;
```

Defined in: [index.ts:900](https://github.com/eslachance/enmap/blob/main/src/index.ts#L900)

Similar to
[Array.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce).

#### Type Parameters

| Type Parameter |
| ------ |
| `R` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `predicate` | (`accumulator`, `val`, `key`) => `R` | Function used to reduce, taking three arguments; `accumulator`, `currentValue`, `currentKey`. |
| `initialValue?` | `R` | Starting value for the accumulator |

#### Returns

`R`

***

### filter()

```ts
filter(pathOrFn, value?): V[];
```

Defined in: [index.ts:920](https://github.com/eslachance/enmap/blob/main/src/index.ts#L920)

Similar to
[Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).
Returns an array of values where the given function returns true for that value.
Alternatively you can provide a value and path to filter by using exact value matching.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pathOrFn` | `string` \| (`val`, `key`) => `boolean` | The path to the value to test against, or the function to test with. If using a function, this function should return a boolean. |
| `value?` | `any` | Value to use as `this` when executing function |

#### Returns

`V`[]

***

### sweep()

```ts
sweep(pathOrFn, value?): number;
```

Defined in: [index.ts:950](https://github.com/eslachance/enmap/blob/main/src/index.ts#L950)

Deletes entries that satisfy the provided filter function or value matching.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pathOrFn` | `string` \| (`val`, `key`) => `boolean` | The path to the value to test against, or the function to test with. |
| `value?` | `any` | The expected value - only applicable and required if using a property for the first argument. |

#### Returns

`number`

The number of removed entries.

***

### changed()

```ts
changed(cb): void;
```

Defined in: [index.ts:988](https://github.com/eslachance/enmap/blob/main/src/index.ts#L988)

Function called whenever data changes within Enmap after the initial load.
Can be used to detect if another part of your code changed a value in enmap and react on it.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cb` | (`key`, `oldValue`, `newValue`) => `void` | A callback function that will be called whenever data changes in the enmap. |

#### Returns

`void`

#### Example

```ts
enmap.changed((keyName, oldValue, newValue) => {
  console.log(`Value of ${keyName} has changed from: \n${oldValue}\nto\n${newValue}`);
});
```

***

### partition()

```ts
partition(pathOrFn, value?): [V[], V[]];
```

Defined in: [index.ts:998](https://github.com/eslachance/enmap/blob/main/src/index.ts#L998)

Separates the Enmap into multiple arrays given a function that separates them.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pathOrFn` | `string` \| (`val`, `key`) => `boolean` | the path to the value to test against, or the function to test with. |
| `value?` | `any` | the value to use as a condition for partitioning. |

#### Returns

\[`V`[], `V`[]\]

An array of arrays with the partitioned data.
