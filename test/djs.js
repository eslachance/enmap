const Discord = require('discord.js');

const client = new Discord.Client();
const config = require('./config.json');
const { promisify } = require('util');

const wait = promisify(setTimeout);

const Enmap = require('../');

const channels = new Enmap({ name: 'channels', persistent: true });
const messages = new Enmap({ name: 'messages', persistent: true });
const guilds = new Enmap({ name: 'guilds', persistent: true });
const users = new Enmap({ name: 'users', persistent: true });

client.on('message', (message) => {
  messages.set(message.id, message);
});

client.on('ready', async () => {
  await wait(2000);
  client.channels.filter(c=> !channels.has(c.id))
    .forEach((chan => channels.set(chan.id, chan)));
  client.guilds.filter(g=> !guilds.has(g.id))
    .forEach(guild => guilds.set(guild.id, guild));
  client.users.filter(u=> users.has(u.id))
    .forEach(user => users.set(user.id, user));
});

client.login(config.token);

process.on('unhandledRejection', (err) => {
  console.error('Uncaught Promise Error: ', err);
});
