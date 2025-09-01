# Upgrading Enmap to Version 6

Version 6 of Enmap is a complete re-write, even though most of the API remains identical, and the data can easily be transfered.

Please pay attention to all the changes on this page :) 

## Migration Method

**BEFORE YOU UPGRADE VERSION**, you will need to use `enmap.export()` on Enmap 5, to have a functional backup. 

I *strongly* advise copying your `./data` directory... just in case this breaks ;) 

Here's a quick and dirty script:

```js
const fs = require("fs");
import Enmap from 'enmap';

const enmap = new Enmap({ name: 'nameofenmap' });

fs.writeFile('./export.json', enmap.export(), () => {
  // I hope the data was in fact saved, because we're deleting it! Double-check your backup file size.
  enmap.clear();
});
```

{% hint style="warning" %}
You *will* need to do this for every separate enmap (every "name") you have, individually, with separate export files!
{% endhint %}

Once exporting is done, you can `npm i enmap@latest` to get version 6.X. After this, the *import* needs to be done, as such:

```js
const fs = require("fs");
import Enmap from 'enmap';

const enmap = new Enmap({ name: 'nameofenmap' });

fs.readFile('./export.json', (err, data) => {
  enmap.import(data);
});
```

Marginally tested, but should work fine for any and all data.

## Move to ESM

The first major change is the move to ECMAScript Modules, or *ESM*, which some erroneously call "ES6 modules". This change unfortunately not only
affects the code related to Enmap but also means if you want to keep using it, you'll have to move to ESM too along with the rest of us. Gone is
CJS, here comes ESM!

ESM has been around for a long time, it matches the module format used in other javascript engines (such as browsers) and it used by the majority
of builder tools. If you're using Typescript or doing web frameworks, chances are you're using ESM already. And if you're still on CJS, well,
going to ESM is important in your JavaScript developer journey anyways.

So what does this mean? It means modifying all your imports and exports, starting with Enmap:
```diff
- import Enmap from 'enmap';
+ import Enmap from 'enmap';
```

Is that it? Yes, that's it... for my module. Now you have to do this for the rest of your code. [Here's a bit of a guide for you](../help/CJStoESM.md).

## Removal of the Caching

Caching has been around since Enmap v1, for the simple reason that enmap used wrap around callback-based and promise-based database modules. 
In order to provide a synchronous interface to you, the user, the use of caching to update and read the database in the background. That
hasn't been the case since Enmap 4 where I stripped out the providers and locked it to `better-sqlite3`, the only synchronous database module
that exists for an actual database connection. That means I didn't need the cache anymore, but I kept it for performance reasons.

For more details and justifications, see ["Why Remove Cache?"](../blog-posts/why-remove-cache.md).

This means the following Enmap features are obsolete and have been stripped out from V6, hopefully never to be added again. 

- `enmap.fetch` and `enmap.fetchEverything` : were used to query the database and put the data in cache.
- `enmap.evict` : used to remove from cache.
- `enmap.array` and `enmap.keyArray` : used to list values and keys from cache only.
- `enmap.indexes` : used to get a list of keys in the database (not the cache).
- `options.fetchAll` : determines whether to cache the entire database on load.
- `options.cloneLevel`: was a workaround to objects provided by the user affecting objects in the cache.
- `options.polling` and `options.pollingInterval`: used to update the cache on an interval, useful to sync many processes.
- `options.autoFetch` : used to fetch values automatically when using enmap.get()

So all the above just don't exist anymore. However, they will return in Enmap 6.1 with *optional* controllable caching.

## Removal of duplicate concerns 

Enmap used to essentially extend two different structures: the Map(), and the Array(), javascript structures. With the removal of the cache, 
the Map()... well... I guess at this point Enmap's name is historical because I'm not extending a Map anymore! However, the extension of Map()
for cache and Array for feature meant there was a lot of duplication in the methods. Enmap V6 clears out any method that could be achieved with
another method. I have made every possible effort not to lose power in Enmap, so if you find that something I removed was stupid, please feel
free to make the case for it on our Discord server.

`enmap.keys()`, `enmap.values()` and `enmap.entries()` can be used to get only keys, only values, or *both*, in arrays. This will pull the *entire*
database's worth of data, but that's what you were expecting, so it's fine, isn't it? As such, `enmap.array()` and `enmap.keyArray()` become
obsolete and have been removed.

`enmap.indexes` also isn't useful anymore and was the "uncached" version of `enmap.keys`, so it's removed.

`enmap.count` and `enmap.size` have always been a bit confusing, especially since arrays have a `length`... so I've decided to just call it `enmap.length`.
To maintain backwards compatibility, though, `enmap.size` will remain as an alias.

`enmap.filter()` and `enmap.filterArray()` were always a bit confusing to me. The idea of "returning an Enmap" from Enmap itself was always weird and I
will no longer be doing that - that means that `enmap.filter()` will not simply return an array, and that's it. Also, it returns an array of *values*,
and does not concern itself with returning keys (same for any other method that only returns values in arrays).

## Obsolete things I've deleted

These were already planned, and indicated as deprecated for a while now, but they've now been removed:

- `enmap.equals()` (extremely expensive, not useful)
- `enmap.exists()` (use `has(key, prop)`)
- `enmap.setProp()` (use `set(key, prop)`) 
- `enmap.pushIn()` (use `push(key, prop)`) 
- `enmap.getProp()` (use `get(key, prop)`) 
- `enmap.deleteProp()` (use `delete(key, prop)`) 
- `enmap.removeProp()` (use `remove(key, prop)`) 
- `enmap.hasProp()` (use `has(key, prop)`) 
- `enmap.ready` or `enmap.defer` and all that jazz - completely useless in this sync world.

## Misc changes

- The use of `'::memory::` as a name is removed, you can use `inMemory: true` instead. That means `new Enmap('::memory::')` is now `new Enmap({ inMemory: true })`.
- In all loop methods like `every`, `some`, `map` and `filter`, the **value** now comes first, and **key** second. This matches array methods closer.
- Methods will no longer return the enmap upon executing an action. It's always felt weird to me that some methods returned the enmap and others returned data.
- The `destroy` method is removed, since it doesn't make much sense to delete all the db tables. You can still delete all your stuff with `clear()` though.
- `wal` and `verbose` options have been removed from options, I honestly prefer the default to `journal_mode=WAL`. If you don't like it, run
  `enmap.db.pragma('journal_mode=DELETE')` (you can run direct DB calls to sqlite3 this way). For verbose, pass it as `options.sqliteOptions`, like, 
  `new Enmap({ name: 'blah', sqliteOptions: { verbose: true }})`.
