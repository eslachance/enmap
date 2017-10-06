const Enmap = require('../');
const EnmapLevel = require('enmap-level');
const level = new EnmapLevel({ name: 'test' });
const myColl = new Enmap({ provider: level });

const test = async () => {
  await level.init(myColl);
  console.time('LotsofRecords-PAll');
  const promises = [];
  for (let i = 0; i < 500000; i++) {
    promises.push(myColl.setAsync(`test${i}`, { testValue: 'This is a test Value' }));
  }
  await Promise.all(promises);
  console.timeEnd('LotsofRecords-PAll');
};

test();
