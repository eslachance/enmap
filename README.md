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
import BriteLite from 'britelite';

export default {
  async fetch(request, env) {
    // shananigans to ensure db is initiated only once
		let db = env.__db;
		if(!env.__db) {
      db = new BriteLite({
				name: 'karaoke',
				db: env.DB,
			});
			await db.ready;
			env.__db = db;
    }
    
    await db.set('boolean', true);
    await db.set('integer', 42);
    await db.set('someFloat', 73.2345871);
    await db.set("Test2", "test2");
  }
}
```

For more examples, see [Enmap Basic Usage](https://enmap.evie.dev/usage/basic/)

## Documentation

* [Installation](https://enmap.evie.dev/install)
* [Basic Setup](https://enmap.evie.dev/usage)
* [API Reference](https://enmap.evie.dev/api)
* [Examples](https://enmap.evie.dev/complete-examples)

> Please note that some Enmap features are not available with BriteLite. Documentation is upcoming.

## Support

Support is offered on my official [Evie.Codes Discord](https://discord.gg/N7ZKH3P).
