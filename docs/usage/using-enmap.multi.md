# Using Enmap.multi

To account for people that might use a large number of enmaps in the same project, I've created a new \`multi\(\)\` method that can be used to instanciate multiple peristent enmaps together.

The method takes 3 arguments:

* An `array`  of names for the enmaps to be created.
* An `options` object containing any of the options needed to instanciate the provider. Do not add `name` to this, as it will use the names in the array instead.

Below, an example that uses destructuring:

```javascript
import Enmap from 'enmap';
const { settings, tags, blacklist } = Enmap.multi(['settings', 'tags', 'blacklist']);

// Attaching to an existing object (for instance some API's client)
import Enmap from 'enmap';
Object.assign(client, Enmap.multi(["settings", "tags", "blacklist"]));
```
