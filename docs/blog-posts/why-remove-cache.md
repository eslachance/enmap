---
description: >-
  Why would Enmap V6 remove caching? Doesn't that make it slower? What gives?
---

# Why update to v6???

So, you might be wondering what the main driver of Enmap Version 6 is. Let me give you a little bit of historical context here.

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
not only simplifies the code, and reduces RAM usage by a *wide* margin, it also makes Enmap much faster in a number of situations.

## The SPEED

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

```diff
-1 million enmap5: 2:57.741 (m:ss.mmm)
+1 million enmap6: 2:44.252 (m:ss.mmm)
```

As you can see, the insert time is almost the same. I tried a few times, the time are around 2 minutes 50 seconds, +- 10 seconds.
The speed does not change if the data already exists since it's all new data anyway (this means "key creation" doesn't cost anything).

### Looping over data

Enmap, when looping over data, is generally faster. 

Here's the tests and results. I tried more than once, and it's all the same ballpark.

#### Partition: Faster

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

As you can see Enmap 6 is 8.5x faster with partitioning (again, this is on 1 million rows).

This is partially due to partition() returning an array of 2 Enmap structure. It would potentially
be faster if Enmap 5's partition() returned arrays.

#### Filtering: Faster, sort of

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

Filtering is also faster with Enmap 6 partially because Enmap 5 uses an Enmap as a return value,
rather than an array. filterArray is definitely faster if the data is cached:
```
filterArray enmap: 56.564ms
```

#### Mapping: Slower

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

I **almost** missed the difference in magnitude here: enmap.map() is slower by a lot. 
I'm not sure why and won't expend more time on this, and I don't feel guilty, because 
loading the 1M values took 17s for enmap5 versus the 6ms uncached enmap6. Still a clear
value winner either way.

## Conclusion

I initially was very excited by the better Enmap 6 performance, but that was before I realized that 
some of this better performance is due to using memory-only Enmaps as return values. This means
that some Enmap 5 methods are faster, such as filterArray and map.

As I really do want Enmap 6 to come out, however, I'm satisfied with the current removal of the cache.
it still gives the advantage of having a lot less RAM usage since a cache isn't filled. It also means
more consistency in query times, in memory usage, and availability - some cached methods like partition
*only* worked with cached values and did not fetch keys before running.

I will, however, re-add caching to Enmap 6.1, as an optional addition and potentially more control over
the caching, time-to-live, etc.
