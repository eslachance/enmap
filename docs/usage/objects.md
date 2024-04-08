# Working with Objects

Enmap is a great way to store structured data, and offers a few helper features that directly affect both objects and arrays.

Let's assume for a moment that we want to store the following data structure in Enmap:

```javascript
const myStructure = {
  first: "blah",
  second: "foo",
  changeme: "initial",
  isCool: false
  sub: {
    yay: true,
    thing: "amagig"
  }
}
```

This structure has 5 "properties": `first`, `second`, `changeme`, `isCool`, `sub`. The `sub` property has 2 properties of its own, `yay` and `thing`.

To store this structure in Enmap, you can use a variable, or just straight-up write the object:

```javascript
myEnmap.set("someObject", myStructure);

// Or directly the object
myEnmap.set("someObject", {first: "blah", ...});

// Works with arrays, too!
myEnmap.set("someArray", ["one", "two", "three"]);
```

> **Note:** All further methods _require_ the value to be an object. If you attempt to get, set, modify or remove using the below methods and your value isn't an object, Enmap will throw an error.

## Getting properties

Retrieving a specific property from an object is done through the `get()` method, by specifying both the key and the "path" to the property you want.

The exact method is `<Enmap>.get(key, path)`.

```javascript
const second = myEnmap.get("someObject", "second");
// returns "foo"

const thing = myEnmap.get("someObject", "sub.yay");
// returns true

// The path can be dynamic, too: 
const propToGet = "thing";
const blah = myEnmap.get("someObject", `sub.${propToGet}`);
```

## Checking if a property exists

You can also check if a specific property exists or not. This is done through the `has` method, with a key, and path to the property:

```javascript
myEnmap.has("someObject", "sub.thing"); // returns true

myEnmap.has("someObject", "heck"); // returns false.
```

## Modifying Properties

There are a few various ways to modify properties of both Objects and Arrays. The very basic way to set a property on an object or array is through `.set(key, value, path)` like the following examples:

```javascript
// Set an object property
myEnmap.set("someObject", "newThing", "sub.blah");

// Set an array property
myEnmap.set("someArray", "four", 3);
```

As you can see, setProp\(\) and getProp\(\) work on the same concept that the path can be as complex as you want.

Arrays have additional helper methods, [you can see them here](arrays.md).

