const Enmap = require('../');
const EnmapLevel = require('enmap-rethink');
const level = new EnmapLevel({ name: 'test' });
const myColl = new Enmap({ provider: level });

console.time("Load Existing Records");
const test = async () => {
  await myColl.defer;
  console.timeEnd("Load Existing Records");
  console.time('Inserting 50,000 Records');
  const promises = [];
  for (let i = 0; i < 50000; i++) {
    promises.push(myColl.setAsync(`test${i}`, { testValue: 'This is a test Value' }));
  }
  await Promise.all(promises);
  console.timeEnd('Inserting 50,000 Records');
  console.log(`Enmap now has ${myColl.size} records.`);
  console.time('Deleting Records');
  await myColl.deleteAllAsync(true);
  console.timeEnd('Deleting Records');
  process.exit(0);
};

test();
