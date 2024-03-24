# Updating from v5 to v6

Enmap version 6 is a major rewrite and contains multiple changes that must be taken into consideration when updating.
Though a lot of the API has been tweaked, there should not be a loss of overall capacity, but you'll have some code changes to do.

## Move to ESM

The first major change is the move to ECMAScript Modules, or *ESM*, which some erroneously call "ES6 modules". This change unfortunately not only
affects the code related to Enmap but also means if you want to keep using it, you'll have to move to ESM too along with the rest of us. Gone is
CJS, here comes ESM!

ESM has been around for a long time, it matches the module format used in other javascript engines (such as browsers) and it used by the majority
of builder tools. If you're using Typescript or doing web frameworks, chances are you're using ESM already. And if you're still on CJS, well,
going to ESM is important in your JavaScript developer journey anyways.

So what does this mean? It means modifying all your imports and exports, starting with Enmap:
```diff
- const Enmap = require("enmap");
+ import Enmap from 'enmap';
```

Is that it? Yes, that's it... for my module. Now you have to do this for the rest of your code. [Here's a bit of a guide for you](CJStoESM.md).

## Removal of the Caching

Caching has been around since Enmap v1, for the simple reason that enmap used wrap around callback-based and promise-based database modules. 
In order to provide a synchronous interface to you, the user, the use of caching to update and read the database in the background. That
hasn't been the case since Enmap 4 where I stripped out the providers and locked it to `better-sqlite3`, the only synchronous database module
that exists for an actual database connection. That means I didn't need the cache anymore, but I kept it for performance reasons.

The problem with this is that all data you wanted to use *had* to be in cache, meaning you were using a lot more memory (RAM) than was really
necessary. It also meant Enmap couldn't be used in multi-process programs such as sharded discord bots. You had to do polling which was slow,
clunky, and still could break data.

V6 strips that concept out and makes all calls to the database direct, and not relying on any sort of cache. This means query performance might
be a bit slower, but a lot less memory is being used, which means better scaling as well as no longer having cache invalidation problems. 
I've also gained a lot more knowledge about better-sqlite3 and optimisation, so the "loss" of performance isn't that bad.

**Insert super compelling performance chart of enmap v6 vs previous versions and maybe other modules here**
**Enmap go brrrr**

This means the following Enmap features are obsolete and have been stripped out from V6, hopefully never to be added again. 

- `enmap.fetch` and `enmap.fetchEverything` : were used to query the database and put the data in cache.
- `enmap.evict` : used to remove from cache.
- `enmap.array` and `enmap.keyArray` : used to list values and keys from cache only.
- `enmap.indexes` : used to get a list of keys in the database (not the cache).
- `options.fetchAll` : determines whether to cache the entire database on load.
- `options.cloneLevel`: was a workaround to objects provided by the user affecting objects in the cache.
- `options.polling` and `options.pollingInterval`: used to update the cache on an interval, useful to sync many processes.
- `options.autoFetch` : used to fetch values automatically when using enmap.get()

So all the above just don't exist anymore, yay!

## Removal of duplicate concerns 

Enmap used to essentially extend two different structures: the Map(), and the Array(), javascript structures. With the removal of the cache, 
the Map()... well... I guess at this point Enmap's name is historical because I'm not extending a Map anymore! However, the extension of Map()
for cache and Array for feature meant there was a lot of duplication in the methods. Enmap V6 clears out any method that could be achieved with
another method. I have made every possible effort not to lose power in Enmap, so if you find that something I removed was stupid, please feel
free to make the case for it on our Discord server.

`enmap.keys`, `enmap.values` and `enmap.entries` can be used to get only keys, only values, or *both*, in arrays. This will pull the *entire*
atabase's worth of data, but that's what you were expecting, so it's fine, isn't it? As such, `enmap.array()` and `enmap.keyArray()` become
obsolete and have been removed. Note that `keys`, `values` and `entries` are now **getters** meaning you don't do `enmap.keys()`, but just 
`enmap.keys`. Due to the sync nature of Enmap and better-sqlite3, a getter is possible and a function isn't really necessary.

`enmap.indexes` also isn't useful anymore and was the "uncached" version of `enmap.keys`, so it's removed.

`enmap.count` and `enmap.size` have always been a bit confusing, especially since arrays have a `length`... so I've decided to just call it `enmap.length`.
Am I EnArray now? *philosophy concerns*

`enmap.filter()` and `enmap.filterArray()` were always a bit confusing to me. The idea of "returning an Enmap" from Enmap itself was always weird and I
will no longer be doing that - that means that `enmap.filter()` will not simply return an array, and that's it. Also, it returns an array of *values*,
and does not concern itself with returning keys (same for any other method that only returns values in arrays).

## Obsolete things I've deleted

These were already planned, and indicated as deprecated for a while now, but they've now been removed:

- `enmap.partition()` (unused)
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
