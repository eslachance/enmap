# Usage Documentation

Mostly, this documentation will be concentrating on the "persistent" version of enmap - the one where data is saved automatically.

If you don't want persistence, the only difference is how you initialize the enmap: 

```javascript
import Enmap from 'enmap';
const myEnmap = new Enmap();

// you can now use your enmap directly
```

### Persistent Enmaps

By default, Enmap saves only in memory and does not save anything to disk. To have persistent storage, you need to add some options. Enmaps with a "name" option will save, and there are additional options you can use to fine-tune the saving and loading features.

```javascript
import Enmap from 'enmap';

// Normal enmap with default options
const myEnmap = new Enmap({ name: "points" });
const otherEnmap = new Enmap({ name: "settings" });

// In-memory enmap, lost when the app reboots
const ephemeral = new Enmap({ inMemory: true });
```

### Enmap Options

The following is a list of all options that are available in Enmap, when initializing it: 

* `name`: A name for the enmap. Defines the table name in SQLite \(the name is "cleansed" before use\).
* `inMemory`: Defaults to `false`. If set to `true`, no data is saved to disk. Methods will work the same but restarting your app will lose all data. This can be set separately in each enmap.
* `dataDir`: Defaults to `./data`. Determines where the sqlite files will be stored. Can be relative \(to your project root\) or absolute on the disk. Windows users , remember to escape your backslashes!
* `ensureProps`: Defaults to `true`. When adding values to an object using a `path`, ensureProps will automatically create any level of object necessary for the value to be written.
* `autoEnsure`: default is disabled. When provided a value, essentially runs ensure(key, autoEnsure) automatically so you don't have to. This is especially useful on get(), but will also apply on set(), and any array and object methods that interact with the database.
* `serializer` Optional. If a function is provided, it will execute on the data when it is written to the database. This is generally used to convert the value into a format that can be saved in the database, such as converting a complete class instance to just its ID. This function may return the value to be saved, or a promise that resolves to that value (in other words, can be an async function).
* `deserializer` Optional. If a function is provided, it will execute on the data when it is read from the database. This is generally used to convert the value from a stored ID into a more complex object. This function may return a value, or a promise that resolves to that value (in other words, can be an async function).
* `sqliteOptions` Optional. An object of [options](https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md#new-databasepath-options) to pass to the better-sqlite3 Database constructor.
