# Using Enmap.multi

To account for people that might use a large number of enmaps in the same project, I've created a new \`multi\(\)\` method that can be used to instanciate multiple peristent enmaps together.

The method takes 3 arguments:

* An `array`  of names for the enmaps to be created.
* A Provider \(not instanciated\), from any of the available ones.
* An `options` object containing any of the options needed to instanciate the provider. Do not add `name` to this, as it will use the names in the array instead.

Below, an example that uses destructuring:

```javascript
const Enmap = require('enmap');
const Provider = require('enmap-mongo');
const { settings, tags, blacklist, langs } = 
    Enmap.multi(['settings', 'tags', 'blacklist', 'langs'],
    Provider, { url: "mongodb://localhost:27017/enmap" });
```

