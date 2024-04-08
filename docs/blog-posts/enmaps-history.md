# Enmap's History

From the first moment where I started using the Discord.js library, one thing in it fascinated me: "Collections". Discord.js Collections are a Map structure from JavaScript on top of which a bunch of useful methods are added, most notably those from JavaScript's Array structure.

Things like map, filter, reduce, find, sort... they made Maps so useful, so much more powerful, that I admired their design. It struck me at one point, that if such a structure were to be separated from Discord.js and perhaps made to be saved in a database, it would make interacting with data so easy that even a child could do it.

So when I started getting seriously into bot that required their own data to be saved, I turned to Amish Shah \(Hydrabolt\) and I said to him, I said "Listen, buddy, can I extract Collections and publish them as a separate module? That'd be awesome!" and Amish replied, like the great guy he is, "uhhhh sure, why not?"

And so, in May 2017, the `djs-collection` module was born. It was a simple thing, just straight-up lifted from Discord.js' code \(not illegally, mind you, I retained all proper licenses and credits to Hydrabolt!\). The following month, I added persistence \(saving to a database\) to it and published `djs-collection-persistent` , which then became my own defacto way to save data to a database.

But... let's be honest, `npm install --save djs-collection-persistent` is a mouthful to type out. Plus, I was realizing that having those two as separate modules meant I had to update them separately and ensure they still worked individually... So at one point, I decided it was time to merge them.

Releasing a single repository meant that I could now change the name, because of the aformentioned "omg mile-long name" problem, and just the overall annoyance of writing it. So I settled on "well, they're enhanced maps, let's call it Enmap!". A quick search revealed Enmap's only other apparent meaning was that it was the name of a satellite, and I was guessing no one would confuse the two.

But I didn't want to _force_ enmap users to have persistence, so at the same time I actually created a _separate_ module called `enmap-level`, which controlled the database layer and was completely optional. These modules I called _Providers_ since, obviously, they provided data persistence and and API.

Enmap 0.4.0 was released at the beginning of October 2017, and since then has grown into a fairly solid module used by tens of thousands of people across the world, not only in discord.js bots but also in other projects built with Node. Its solidity and simplicity makes it the ideal storage for simple key/value pairs, and I'm extremely proud to have made it.

At the moment of writing this \(2018-09-02\) Enmap has been downloaded over 32,000 times and is growing by the minute with almost 10,000 downloads in August alone!

## Update, August 2019

It's been a year now since I last wrote this post. And in case you were wondering, growth hasn't stopped! In fact, it's quite accelerated. One big change that I made was to go back to a single locked-in database provider, which I describe in Why SQLite Only?

Other than that, and adding some new features due to the switch to better-sqlite3, the main event is that just las month I reached a whopping 500,000 downloads for Enmap. Yes, that's a half million downloads for my little useful module that I started making for myself and ended up being useful for so many.

