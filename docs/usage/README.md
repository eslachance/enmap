# Usage Documentation

Mostly, this documentation will be concentrating on the "persistent" version of enmap - the one where data is saved automatically.

If you don't want persistence, the only difference is how you initialize the enmap: 

```javascript
const Enmap = require("enmap");
const myEnmap = new Enmap();

// you can now use your enmap directly
```

### Persistent Enmaps

By default, Enmap saves only in memory and does not save anything to disk. To have persistent storage, you need to add some options. Enmaps with a "name" option will save, and there are additional options you can use to fine-tune the saving and loading features.

```javascript
const Enmap = require("enmap");

// Normal enmap with default options
const myEnmap = new Enmap({name: "points"});

// non-cached, auto-fetch enmap: 
const otherEnmap = new Enmap({
  name: "settings",
  autoFetch: true,
  fetchAll: false
});
```

### Enmap Options

The following is a list of all options that are available in Enmap, when initializing it: 

* `name`: A name for the enmap. Defines the table name in SQLite \(the name is "cleansed" before use\). 
  * If an enmap has a name, **it is considered persistent** and will require `better-sqlite-pool` to run.
  * If an enmap does not have a name, **it is not persistent** and any option related to database interaction is ignored \(fetchAll, autoFetch, polling and pollingInterval\).
* `fetchAll`: Defaults to `true`, which means fetching all keys on load. Setting it to `false` means that no keys are fetched, so it loads faster and uses less memory. 
* `autoFetch`: Defaults to `true`. When enabled, will automatically fetch any key that's requested using get, getProp, etc. This is a "synchronous" operation, which means it doesn't need any of this promise or callback use.
* `dataDir`: Defaults to `./data`. Determines where the sqlite files will be stored. Can be relative \(to your project root\) or absolute on the disk. Windows users , remember to escape your backslashes!
* `cloneLevel`: Defaults to `deep`. Determines how objects and arrays are treated when inserting and retrieving from the database.
  * `none`: Data is inserted _by reference_, meaning if you change it in the Enmap it changes outside, and vice versa. **This should only be used in non-persistent enmaps if you know what you're doing!**.
  * `shallow`: Any object or array will be inserted as a shallow copy, meaning the first level is copied but sub-elements are inserted as references. This emulates Enmap 3's behavior, but is not recommended unless you know what you're doing.
  * `deep`: Any object or array will be inserted and retrieved as a deep copy, meaning it is a completely different object. Since there is no chance of ever creating side-effects from modifying object, **This is the recommended, and default, setting.**
* `polling`: defaults to `false`. Determines whether Enmap will attempt to retrieve changes from the database on a regular interval. This means that if another Enmap in another process modifies a value, this change will be reflected in ALL enmaps using the polling feature. 
* `pollingInterval`: defaults to `1000`, polling every second. Delay in milliseconds to poll new data from the database. The shorter the interval, the more CPU is used, so it's best not to lower this. Polling takes about 350-500ms if no data is found, and time will grow with more changes fetched. In my tests, 15 rows took a little more than 1 second, every second. 

