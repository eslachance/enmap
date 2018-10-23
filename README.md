# Enmap - Enhanced Maps

<div align="center">
  <p>
    <a href="https://discord.gg/N7ZKH3P"><img src="https://discordapp.com/api/guilds/298508738623438848/embed.png" alt="Discord server" /></a>
    <a href="https://www.npmjs.com/package/enmap"><img src="https://img.shields.io/npm/v/enmap.svg?maxAge=3600" alt="NPM version" /></a>
    <a href="https://www.npmjs.com/package/enmap"><img src="https://img.shields.io/npm/dt/enmap.svg?maxAge=3600" alt="NPM downloads" /></a>
    <a href="https://david-dm.org/eslachance/enmap"><img src="https://img.shields.io/david/eslachance/enmap.svg?maxAge=3600" alt="Dependencies" /></a>
    <a href="https://www.patreon.com/eviecodes"><img src="https://img.shields.io/badge/donate-patreon-F96854.svg" alt="Patreon" /></a>
  </p>
  <p>
    <a href="https://nodei.co/npm/enmap/"><img src="https://nodei.co/npm/enmap.png?downloads=true&stars=true" alt="npm installnfo" /></a>
  </p>
</div>

Enhanced Maps are a data structure that can be used to store data in memory that can also be saved in a database behind the scenes. The data is synchronized to the database automatically, seamlessly, and asynchronously so it should not adversely affect your performance compared to using Maps for storage.

## FAQs

### Q: So what's Enmap

**A**: Enmaps are the Javascript Map() data structure with additional utility methods.

### Q: What is "Persistent"?

**A**: With the use of the optional providers modules, any data added to the Enmap
is stored not only in temporary memory but also backed up in a local database. 

### Q: How big can the Enmap be?

**A**: In its initial implementation, upon loading Enmap, all
key/value pairs are loaded in memory. The size of the memory used is directly
proportional to the size of your actual database. 

## Installation

To use Enmap, see [The installation guide](https://evie.gitbook.io/enmap/v/3/install)

## API Documentation

API docs are [available here](https://evie.gitbook.io/enmap/v/3/api-documentation)