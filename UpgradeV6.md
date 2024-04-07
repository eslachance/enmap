# Why update to v6???

So, you might be wondering what the main driver of Enmap Version 6 is. Let me give you a little bit of historical contet here.

Before Enmap, there was [djs-collection-persistent](https://www.npmjs.com/package/djs-collection-persistent). This module was born
from using discord.js' Collection, and the idea was, "What if I could use that, but save it in a database?" and thus, this whole
adventure started. It saved data on `leveldb`, and it was alright. But who the hell wants to remember that name?

And thus, Enmap 1.0 was born. The *Enhanced* Map, which detached the name from djs itself. Enmap 1.0 already established Providers,
including leveldb, postgresql, sqlite, rethinkdb, and mongo.

Enmap 2 and 3 added more features, moved things around, but generally stayed the same. Lot of bug fixes, added math, that sort of thing.

In Enmap 4, the main major change was that I removed all providers. I discovered (better-sqlite3)[https://www.npmjs.com/package/better-sqlite3],
the first (and only?) synchronous database module. This started changing everything, but I didn't fully trust its performance yet. So Enmap 4
is sqlite only, persistent, but it still has its cache... that is to say, it's still an enhanced Map structure with persistence. Enmap 5 is
more of the same, updates, small breaking changes, new features, etc. 

But there's a problem : Enmap... is stil cached. It still uses a lot of memory, and that makes it slower than it should be. better-sqlite3 is *fast*
and now I'm updating both the cache (Map) and the database! But I left this sleeping for the last few years as I was doing other things with life.

And here we are. Enmap 6.0 just removes caching, and updates all the map/array methods to directly interact with the database, no cache needed. This
not only simplifies the code, and reduces RAM usage by a *wide* margin, it also makes Enmap **FAST**. I mean... really fast. 

## The SPEED

HOW FAST? Let's take a look!

### Loading

Loading of data remains approximately the same when empty, but can be much faster in Enmap 6 the larger your database is, if `autoFetch` is `true`.
With the 1 million rows, Enmap 6 loads in 6ms (milliseconds) but Enmap 5 loads in 20s (seconds). That's a massive difference, because of caching.

### Adding Data

This test inserts 1 million rows in a simple for loop. Each entry is an object with multiple randomly generated numbers.

Here's the actual test!
```js
const rnum = size => Math.floor(Math.random() * (size + 1));

for (let i = 1; i <= 1_000_000; i++) {
  enmap.set(`obj${i}`, {
    key: `obj${i}`,
    a: rnum(100),
    b: rnum(100),
    c: rnum(100),
    d: rnum(100),
    e: rnum(100),
  });
}
```

```
1 million enmap5: 2:57.741 (m:ss.mmm)
1 million enmap6: 2:44.252 (m:ss.mmm)
```
As you can see, the insert time is almost the same. I tried a few times, the time are around 2 minutes 50 seconds, +- 10 seconds.
The speed does not change if the data already exists since it's all new data anyway (this means "key creation" doesn't cost anything).

### Looping over data

So here's where we have the meat of the magic. The Unicorn steak, if you will. Enmap, looping over data, is up to 10 times faster. 

You've read that right. ***__10 times faster__***. 

Here's the tests and results. I tried more than once, and it's all the same ballpark: 

```js
console.time('partition enmap');
const [one, two] = enmap.partition((value) => value.a % 2 === 0);
console.timeEnd('partition enmap');

console.time('partition enmap6');
const [one6, two6] = enmap6.partition((value) => value.a % 2 === 0);
console.timeEnd('partition enmap6');
```

```diff
-partition enmap5: 51.221s
+partition enmap6:  6.048s
```

```js
console.time('filter enmap');
const filtered = enmap.filter((value) => value.a % 2 === 0);
console.timeEnd('filter enmap');

console.time('filter enmap6');
const filtered6 = enmap6.filter((value) => value.a % 2 === 0);
console.timeEnd('filter enmap6');
```

```diff
- filter enmap5: 28.315s
+ filter enmap6:  5.560s
```

I **almost** missed the difference in magnitude here: enmap.map() is slower by a lot. 
I'm not sure why and won't expend more time on this, and I don't feel guilty, because 
loading the 1M values took 17s for enmap5 versus the 6ms uncached enmap6. Still a clear
value winner either way.

```js
console.time('map enmap');
const mapped = enmap.map((value) => value.a * 2);
console.timeEnd('map enmap');

console.time('map enmap6');
const mapped6 = enmap6.map((value) => value.a * 2);
console.timeEnd('map enmap6');
```

```diff
-map enmap5: 47.295ms
+map enmap6:  6.271s
```


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
- Methods will no longer return the enmap upon executing an action. It's always felt weird to me that some methods returned the enmap and others returned data.
- The `destroy` method is removed, since it doesn't make much sense to delete all the db tables. You can still delete all your stuff with `clear()` though.
- `wal` and `verbose` options have been removed from options, I honestly prefer the default to `journal_mode=WAL`. If you don't like it, run
  `enmap.db.pragma('journal_mode=DELETE')` (you can run direct DB calls to sqlite3 this way). For verbose, pass it as `options.sqliteOptions`, like, 
  `new Enmap({ name: 'blah', sqliteOptions: { verbose: true }})`.
