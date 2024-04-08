---
description: >-
  This page will describe how to use Enmap from multiple files within your same
  project. Note that I mean the same app, process, or shard, but different files
  within this one running process.
---

# Using from multiple files

## A common issue

When Enmap is used with its default options, it loads everything in its cache and generally provides your data from this cache, not directly from the database. In the case where you want to use the data from one Enmap from multiple locations, you might encounter the following issue:

> Hi! When I update data in Enmap from one file, it doesn't update in the other file, I have to restart the bot to update. Is this a bug?

To answer my own obvious question: it's not a bug, it's a feature that I cannot implement. The way Enmap's cache works is that the data is loaded in memory _in that _[_instance _](https://js.evie.dev/classes)_of Enmap_, and only for that instance. This is what enables you to have many different Enmaps in your project - one Enmap doesn't share data with another.

However, this also means that when you do `new Enmap({ name: "something" })` from more than one file, that's also a different instance, that doesn't share the same memory space. So not only will it not update the data in memory for the other file, it also uses double the memory. And of course, that's bad. So how do we fix this?

## The Shared Variable Method

Admittedly, the vast majority of you Enmap users are doing Discord.js Bots, and even though Enmap works fine with _any_ nodejs project that need simple data storage, bots are my main clients. Considering this fact, we have an extremely simple way to share an Enmap between multiple files: We attach it to the bot client. Usually your client is defined in your main file (index.js, app.js, bot.js, whatever you named it), and every part of your bot has access to this client. We can attach Enmap directly to it, like so:

```javascript
const Discord = require("discord.js");
const client = new Discord.Client();

const Enmap = require("enmap");

// this is the important bit
client.settings = new Enmap({ name: "settings" });
client.tags = new Enmap({ name: "tags" });

// your normal events here
client.on("message", message => {
  const guildSettings = client.settings.get(message.guild.id);
  // works here
});

client.login(token);
```

This will work even if you're using a command handler, framework, or whatever - as long as you have access to a client variable, you have access to your enmaps.

{% hint style="danger" %}
Important Note: Do NOT override Discord.js' existing collections! That means, client.users, client.guilds, etc. [See all the properties and methods for the Discord.js client](https://discord.js.org/#/docs/main/stable/class/Client) - none of these should be overridden.
{% endhint %}

In other frameworks and libraries, you might have something similar. For example with Express or Koa for http servers, you can sometimes attach the enmap to your request from the very top, in a middleware. If that's not possible, or if you find that to be complicated, you can use the next method.

## The Module Method

All things considered, [modules ](https://js.evie.dev/modules)are probably the recommended way to use your Enmap in multiple files within your project. Not only does it give you a single file to import, lets you define multiple Enmaps you can individually import, it also gives you the ability to add specific functions to do common actions you use throughout your project.

As covered in [My JavaScript Guide](https://js.evie.dev/modules), modules are fairly straightforward. This is how I have done an Enmap shared module before:

```javascript
const Enmap = require("enmap");

module.exports = {
  settings: new Enmap({
    name: "settings",
    autoFetch: true,
    fetchAll: false
  }),
  users: new Enmap("users"),
  tags: new Emmap({ name : "tags" })
}
```

This means you can simply require that file elsewhere. Let's say we called that file `db.js` , here's how you'd use it:

```javascript
const db = require("./db.js");

console.log(db.settings.size);
db.tags.set("blah", {
  guild: "1234",
  author: "4231",
  name: "blah",
  content: "I'm bored, mommy!"
});
```

And as I mentioned, as a bonus you now have the ability to create functions which you can export and use, to simplify your code and remove duplication. So, let's say I need to get all the tags for a specific guild, and my tags are built using an object as shown above. To get all those tags for a guild, you'd need filters, right? Like so:

```javascript
const guildTags = db.tags.find(tag => tag.guild === message.guild.id);
```

now let's say you use this code _a lot_ in your app, and you'd like to not have to type this whole thing every time. You could add a simple function in your module that only takes an ID and returns the tags:

```javascript
const Enmap = require("enmap");

module.exports = {
  settings: new Enmap({
    name: "settings",
    autoFetch: true,
    fetchAll: false
  }),
  users: new Enmap("users"),
  tags: new Emmap({ name : "tags" }),
  getTags: (guild) => {
    return this.tags.find(tag => tag.guild === message.guild.id);
  }
}
```

And there you have it! There are other ways to build the exports, you can also split it differently, take a look at [My Modules Guide ](https://js.evie.dev/modules)for more information.
