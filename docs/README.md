---
description: >-
  Enmap, the super simple database wrapper with over a million downloads to
  date. Wrapping around better-sqlite3 with its warm embrace, it's the easiest
  way to save data in node for your first project!
---

# What is Enmap?

![](assets/enmap-logo.svg)

Enmap stands for "Enhanced Map", and is a data structure based on the native JavaScript Map() structure with additional helper methods from the native Array() structure. Enmap also offers _persistence_, which means it will automatically save everything to save to it in a database, in the background, without any additional code or delays.

{% hint style="danger" %}
Enmap requires filesystem access. It **DOES NOT WORK** on Heroku, or other such systems that do not allow you to save data directly to disk.

It should also not be used on **Repl.it** where the data cannot be hidden (and will be public) or on **Glitch** which has been known to break Enmap's data persistence and lose data.
{% endhint %}

## Why Enmap?

While there are other better-known systems that offer some features of Enmap, especially caching in memory, Enmap is targeted specifically to newer users of JavaScript that might not want to deal with complicated systems or database queries.

## Advantage/Disadvantage

Here are some advantages of using Enmap:

* **Simple to Install**: Enmap itself only requires a simple `npm install` command to install and use, and a single line to initialize. [See Installation for details](install/).
* **Simple to Use**: Basic Enmap usage can be completely done with 1-2 lines of initialization, and 3 commands, set(), get() and delete().
* **Very Fast**: Since Enmap resides in memory, accessing its data is blazing fast (as fast as Map() is). Even with persistence, Enmap still accesses data from memory so you get it almost instantly.

Some disadvantages, compared to using a database connection directly:

* **More memory use**: Since Enmap resides in memory and (by default) all its data is loaded when it starts, your entire data resides in RAM. When using a large amount of data on a low-end computer or VPS, this might be an issue for some users.
* **Limited power**: You can have multiple Enmap "tables" loaded in your app, but they do not and cannot have relationships between them. Basically, one Enmap value can't refer to another value in another Enmap. This is something databases can be very good at, but due to the simplistic nature of Enmap, it's not possible here.
* **Lack of scalability**: Enmap is great for small apps that require a simple key/value storage. However, a scalable app spread over multiple processes, shards, or clusters, will be severely limited by Enmap as it cannot update itself from the database on change - one process would not be aware of another process' changes.
