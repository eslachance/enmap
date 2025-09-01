---
description: >-
  Let's take a quick peek at what Josh is, and what it means for the future of
  Enmap
---

# Enmap and Josh

As I've noted in my[ previous blog post](why-sqlite-only.md), when Enmap moved to SQLite only, there were a few feathers and features lost in transition. Most notably, the loss of Providers was a big one, even though in my opinion it was a good trade-off to get the new features I wanted to include in Enmap 4 and onward.

But since that moment where Providers were removed, I had a plan in mind to give those that needed them an escape route. And not only that, Enmap itself does have some pretty solid limitations when it comes to growth, because of its lack of ability to support multiple processes and sharded applications.

### Introducing Josh

Then plan was [Josh](https://josh.alterion.dev/), all along. Josh is the Javascript Object Storage Helper, and if that sounds a lot like what Enmap does it's because it is. In fact, [Josh ](https://josh.alterion.dev/)could best be described to you, my reader, as "A version of Enmap that doesn't have caching, is promised-based, and supports providers again". 

So I've been working on it for a few years now - not full time, mind you, as it would have been ready a long time ago, but as a side project. It's finally picked up steam, and you can Get Josh right now to try out the early access version. It's limited \(not as powerful as Enmap is currently\) but that's rapidly evolving. 

### So what does that mean for Enmap?

You might immediately wonder, "But Evie, if you're working on Josh, what's going to happen with Enmap?" and I'm telling you right now, you don't need to worry about this. Enmap is still growing in popularity, I still have things to do with it, and I fully intend on maintaining and enhancing it in the future. 

Josh might be similar to Enmap but it's not made to replace it! It has a different purpose, which is to support larger applications, potentially web-based ones, provide live updates, and all the things that were lost with Enmap's great provider purge. And since Josh is promise-based, it's not as simple to pick up as Enmap was, so I do expect people to start off with Enmap either way.

Josh and Enmap should, and will, be fully compatible with one another, in that you will be able to easily migrate between them \(with [export](../api.md#enmap-export-string)\(\) and [import](../api.md#enmap-import-data-overwrite-clear-enmap)\(\) \), and moving from one to another would require a minimal amount of code changes. It's not zero, but I'm trying as much as possible to keep those differences as small as possible.

### What does the future hold?

I've already back-ported a few things that I originally intended for Josh as part of Enmap's new updates. The [observe](../api.md#enmap-observe-key-path)\(\) method, as well as the[ serializer/deserializer](../usage/serialize.md) feature, were originally intended for Josh but ended up being implementable in Enmap also. This means, if I add a feature to Josh, I will add it to Enmap if I can, if it's compatible. So you won't be left behind!

It is my sincere hope that Enmap and Josh will both continue to grow, to help more people, and to help us all create better code, together!

