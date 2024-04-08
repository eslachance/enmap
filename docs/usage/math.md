# Mathematical Methods

{% hint style="warning" %}
This page is a work in progress and may not have the polish of a usual Evie-Written document!
{% endhint %}

Some quick docs: 

### enmap.math\(key, operation, operator, \[objectPath\]\)

```javascript
// Assuming
points.set("number", 42);
points.set("numberInObject", {sub: { anInt: 5 }});
 
points.math("number", "/", 2); // 21
points.math("number", "add", 5); // 26
points.math("number", "modulo", 3); // 2
points.math("numberInObject", "+", 10, "sub.anInt");
```

Possible Operators \(accepts all variations listed below, as strings\): 

* `+`, `add`, `addition`: Increments the value in the enmap by the provided value.
* `-`, `sub`, `subtract`: Decrements the value in the enmap by the provided value.
* `*`, `mult`, `multiply`: Multiply the value in the enmap by the provided value.
* `/`, `div`, `divide`: Divide the value in the enmap by the provided value.
* `%`, `mod`, `modulo`: Gets the modulo of the value in the enmap by the provided value.
* `^`, `exp`, `exponential`: Raises the value in the enmap by the power of the provided value.

### enmap.inc\(key, \[objectPath\]\)

```javascript
// Assuming
points.set("number", 42);
points.set("numberInObject", {sub: { anInt: 5 }});
 
points.inc("number"); // 43
points.inc("numberInObject", "sub.anInt"); // {sub: { anInt: 6 }}
```

### enmap.dec\(key. \[objectPath\]\)

```javascript
// Assuming
points.set("number", 42);
points.set("numberInObject", {sub: { anInt: 5 }});
 
points.dec("number"); // 41
points.dec("numberInObject", "sub.anInt"); // {sub: { anInt: 4 }}
```



