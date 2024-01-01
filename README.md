# BriteLite : Enmap, but for Cloudflare D1

<!-- <div align="center">
  <p>
    <a href="https://discord.gg/N7ZKH3P"><img src="https://discordapp.com/api/guilds/298508738623438848/embed.png" alt="Discord server" /></a>
    <a href="https://www.npmjs.com/package/enmap"><img src="https://img.shields.io/npm/v/enmap.svg?maxAge=3600" alt="NPM version" /></a>
    <a href="https://www.npmjs.com/package/enmap"><img src="https://img.shields.io/npm/dt/enmap.svg?maxAge=3600" alt="NPM downloads" /></a>
    <a href="https://www.patreon.com/eviecodes"><img src="https://img.shields.io/badge/donate-patreon-F96854.svg" alt="Patreon" /></a>
  </p>
</div>

<div align="center">
  <p><img src="https://evie.codes/enmap-logo.svg" alt="Enmap Logo" />
</div> -->

> PLEASE NOTE: This is under review and still refers to "enmap" everywhere - replace "enmap" with "britelite" and it should be alright :P

Basic usage: 

```
npm install britelite
```

```js
const BriteLite = require("britelite");

export default {
  async fetch(request, env) {
    // shananigans to ensure db is initiated only once
    if(!env.__db) {
      env.__db = new BriteLite("exampledb", env.DB);
    }

    const mydb = env.__db;
    
    env.example.set('boolean', true);
    env.example.set('integer', 42);
    env.example.set('someFloat', 73.2345871);
    env.example.set("Test2", "test2");
  }
}
```

Ffor more examples, see [Enmap Basic Usage](https://enmap.evie.dev/usage/basic/)

## Documentation

* [Installation](https://enmap.evie.dev/install)
* [Basic Setup](https://enmap.evie.dev/usage)
* [API Reference](https://enmap.evie.dev/api)
* [Examples](https://enmap.evie.dev/complete-examples)

## Support

Support is offered on my official [Evie.Codes Discord](https://discord.gg/N7ZKH3P).
