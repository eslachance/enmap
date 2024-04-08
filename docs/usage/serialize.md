---
description: >-
  Learn how to manipulate the data you save and retrieve from the database, to
  more easily store complex data without having to convert it to simple data
  everywhere you use it.
---

# Serializing and Deserializing

_**Introduced in Enmap 5.6**_, Serializers and Deserializers are functions that you use to manipulate the data before storing it in the database, or before using it after retrieving it. 

This feature is born from a limitation in Enmap: it cannot store very complex objects, such as the instance of a class, objects with circular references, functions, etc. So, typically when you have such data, you need to manually convert it to some simple representation before storing, and then do the inverse after getting it from enmap. This is a more automated way of doing it.

### What are they?

The Serializer function runs every single time data is stored in the enmap, if one is provided. This function receives the data provided to set\(\) as an input, and must return a value to be stored in the database. This function _MUST_ be synchronous, that is to say, cannot be an async function or return a promise. 

```javascript
// the default serializer
const serializer = (data, key) => {
  return data;
};
```

The Deserializer function is the reverse, and runs on each value pulled from the database, before it is returned through the get\(\) method. This function receives the data stored in the database and returns the value that you want to use directly. This function _MUST_ be synchronous, that is to say, cannot be an async function or return a promise. 

```javascript
// the default deserializer
const deserializer = (data, key) => {
  return data;
};
```

### Examples

#### Guild Settings: A more sensible example

Taking a hit from my own example of Per-Server Settings, this is a better example that doesn't require storing just the name of a channel, but straight-up the channel itself.

```javascript
// Imagine the client and stuff is already defined.


// The function that runs when storing data
const serializeData: data => {
 return {
   ...data,
   // stores the guild as ID
   guild: guild.id,
   // stores the user as ID
   user: user.id,
 }
};

// This one runs when loading.
const deserializeData: data => {
  return {
    ...data,
    // gets the guild itself from the cache from its ID
    guild: client.guilds.cache.get(data.guild),
    // Same with the user!
    user: client.users.cache.get(data.user),
  }
};

// Default Settings can no longer store defaults for roles and channels.
const defaultSettings = {
  prefix: "!",
  modLogChannel: null,
  modRole: null,
  adminRole: null,
  welcomeChannel: null,
  welcomeMessage: "Say hello to {{user}}, everyone!"
}

// Our enmap has shiny new options here!
client.settings = new Enmap({
  name: "settings",
  cloneLevel: 'deep',
  serializer: serializeData,
  deserializer: deserializeData,
  // Might as well autoensure, eh?
  autoEnsure: defaultSettings,
});


// Store some data, obviously needs to be run in the right place: 
client.settings.set(message.guild.id,
  message.mentions.channels.first(),
  'welcomeChannel'
);

client.settings.set(message.guild.id,
  message.mentions.roles.first(),
  'adminRole'
);

// GET the data after
const welcomeChannel = client.settings.get(message.guild.id, 'welcomeChannel');
welcomeChannel.send("This works without having to find or get the channel!");
```

