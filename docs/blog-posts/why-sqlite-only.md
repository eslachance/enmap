---
description: >-
  This page explains the reason behind the removal of the "Provider" system, and
  the selection of sqlite as the only database available for Enmap starting
  version 4
---

# Why SQLITE only?

## Why providers in the first place?

So one of the major changes from Enmap 3 to 4 is the removal of Providers. Providers were something I've had since Enmap 1.0 \(when I converted from djs-collections-persistent\), and had 2 advantages \(2 reasons to have them in the first place\).

1. It enabled supporting more databases, not only one. This gave more power to users, and, I thought, more capabilities. 
2. It separated the memory enmap \(non-persistent\) from the database layer, so installing enmap didn't require installing sqlite. 

## And why remove them?

But, after a year of updating Enmap, I realized that I'd painted myself in a corner with Providers. There came to light that there were multiple limitations to providers:

1. Features were limited to the "lowest common denominator", whatever was available to _all_ providers. For instance, better-sqlite3 is a synchronous module that's nonblocking \(which is a magical thing, really\). But since all other providers required promises, then I had to use sqlite as a promise module. 
2. Maintaining multiple providers is hard work. Every new feature would require updating all the providers \(5 at this time\), and there were many requests to create new providers which is an annoying, sometimes complicated task that adds even more work in the future. 
3. There were features I wanted that simply weren't possible, physically, with the providers \([like the fetchAll/autoFetch options](../usage/fetchall.md)\).

In addition, the advantages became lesser with time. I realized most people were using leveldb at first, then most switch to sqlite when I updated guides to use that provider. Essentially, most people use whatever they're told to use. So, just forcing one database wasn't that much of an issue and didn't affect the majority of users.

Also, most people did use enmap with persistence, and those that didn't... well, most users have enmap to use with discord.js bots in the first place which gives them Collection - almost the same as a non-persistent enmap.

## What are the advantages of sqlite?

The reasoning behind removing all other providers and keeping sqlite was for specific features and capabilities inherent to the module I'm using, better-sqlite3.

* better-sqlite3 is, as I mention, _synchronous_ , which means, no callbacks, no promises. Just straight-up "make a request and it does it before the next line". No more need for "waiting" for things, resolving promises, etc.
* The sync nature of better-sqlite3 means I can add an autoFetch feature. I can simply say "If the key isn't there, try to get the data", without requiring the user to resolve a promise. This is awesome.
* By the same token, I can also add simple things like "get all keys in the database" using a _getter_. This means you can do `enmap.indexes` and this is actually querying the database seamlessly without the user really knowing it does that. Same for `enmap.count` and other features I'm planning. 

So overall, I'm happy with my decision. It gives me more power, it gives users more features, and the people affected by the removal of the other providers are few and far between. Hell, enmap-pgsql has less than 1000 downloads on npm which is mostly mirrors and caches. It showed me that provider was pretty useless in the first place.

## But what about people that NEED a provider?

~~I recognize that some people might want to use enmap and can't use sqlite. This is for many valid reasons, for example using it on heroku which doesn't support sqlite and leveldb. For those users, I'm keeping the providers open for maintenance. If someone wants to maintain and update the V3 branch, or even fork the entire system and maintain it under a new name, I have no issue with that \(assuming licenses are properly kept\). I'll accept PRs on all enmap repositories, including backporting some features and adding new ones.~~

~~I'm also keeping the V3 docs in this gitbook so it can be maintained through gitbook and PRed on github.~~

~~You can still install any provider as you would before, and install enmap using `npm i eslachance/enmap#v3` for the version 3 branch that will remain.~~

Update: Enmap's no longer hosted on gitbook, and Enmap V3 is old enough to be dangerous to use due to potential security vulnerabilities, and providers most likely don't work on recent node versions anyways. All Enmap 3 providers are deprecated and archived.
