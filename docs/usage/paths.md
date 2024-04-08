---
description: 'What is Paths in Enmap, how to use them, what is their syntax?'
---

# Understanding Paths

In a whole lot of methods for Enmap, one of the properties is the "path". Paths are used in _Object_ data saved in Enmap, that is to say, setting or ensuring a value that is an object at the top level.

To understand what a path really means, we can start by having an object as a value. Here I'm not even using Enmap, as the idea is related to basic JavaScript, not my module.

```javascript
const myObject = {
  a: "foo",
  b: true,
  c: {
    but: "who",
    are: "you?",
    and: ["are you", "you?"],
  },
  sub: { values: { are: { "cool" } } },
};
```

So here we have an object that actually has multiple levels, that is to say, the `c` and `sub` properties have, as a value, another object with its own keys. `sub` takes this further with 4 different levels, just to fully demonstrate my point.

So how would we reach the values in this object? Well, in core JavaScript, let's say we wanted to get the word "cool", we'd use `myObject.sub.values.are.cool`. This is one way to access object properties, the other one being `myObject["sub"]["values"]["are"]["cool"]` \(where those strings can be variables, btw, for dynamic property access\).

Alright so what about the array, there? Well, arrays are accessed through their index, meaning their position in the array, starting at 0. That means to access the `c.and` values, you'd do something like `myObject.c.and[0]` . That looks like a strange syntax I'll admit, but considering you can use the same for objects, `myObject["c"]["and"][1]` perhaps looks a bit more coherent.

### Doing it in Enmap

Now that you've seen how to access those properties in regular JavaScript, what about doing it in Enmap? Well, it's actually quite simple: the `path` parameter in the methods simply take exactly what you've seen above, with 2 exceptions:

* The path doesn't include the object name \(which is your `key`\)
* You don't need to use variables for dynamic paths since it's a string

What does that mean in reality? Well let's rewrite the example above as Enmap code: 

```javascript
myEnmap.set("myObject", {
  a: "foo",
  b: true,
  c: {
    but: "who",
    are: "you?",
    and: ["are you", "you?"],
  },
  sub: { values: { are: { "cool" } } },
});
```

To access the "cool" string, the code then becomes `myEnmap.get("myObject", "sub.values.are")` . Accessing the array values looks the same: `myEnmap.get("myObject", "c.and[0]")` . In this case indexes can be used either way, so you can also do `myEnmap.get("myObject", "c.and.0")` and that'll work equally well.

