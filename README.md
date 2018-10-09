# Enmap - Enhanced Maps

Enhanced Maps are a data structure that can be used to store data in memory that can also be saved in a database behind the scenes. These operations are fast, safe, and painless.

The data is synchronized to the database automatically, seamlessly, and asynchronously for maximum effectiveness. The storage system used is an `sqlite` database which is fast,
performant, can be easily backed up, and supports multiple simultaneous connections.

## Documentation

 * [Installation](https://evie.gitbook.io/enmap/install)
 * [Basic Setup](https://evie.gitbook.io/enmap/usage)
 * [API Reference](https://evie.gitbook.io/enmap/api)
 * [Examples](https://evie.gitbook.io/enmap/examples)

## Support

Support is offered on my official [Evie.Codes Discord](https://discord.gg/N7ZKH3P).

## FAQs

### Q: So what's Enmap

**A**: Enmaps are the Javascript Map() data structure with additional utility methods. This started
as a pretty straight clone of the [Discord.js Collections](https://discord.js.org/#/docs/main/stable/class/Collection)
but since its creation has grown far beyond those methods alone.

### Q: What is "Persistent"?

**A**: With the use of the optional providers modules, any data added to the Enmap
is stored not only in temporary memory but also backed up in a local database. This means that
when you restart your project, your data is not lost and is loaded on startup.

### Q: How big can the Enmap be?

**A**: The size of the memory used is directly proportional to the size of all the keys loaded in memory.
The more data you have, the more complex it is, the more memory it can use. You can use the
[fetchAll](https://evie.gitbook.io/enmap/usage/fetchall) options to reduce memory usage.

### Q: Who did you make this for?

**A**: Well, myself because I do use it often. But also, I built it specifically for beginners in mind. 
Enmap's main goal is to remain simple to use, as fast as possible, and a solid as possible.

### Q: What's it used for?

**A**: Enmap is useful for storing very simple key/value data for easy retrieval, and also for more complex objects with many properties. 
Mainly, because of who I originally made this for, it's used in Discord.js Bots to save currencies, content blocks, server settings, and
user information for bans, blacklists, timers, warning systems, etc.
