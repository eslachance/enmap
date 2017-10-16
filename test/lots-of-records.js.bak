const Enmap = require('../');
const myColl = new Enmap({ name: '1mil', persistent: true });

const test = async () => {
  await myColl.defer;
  console.time('LotsofRecords-PAll');
  let promises = [];
  for (let i = 0; i < 500000; i++) {
    promises.push(myColl.setAsync(`test${i}`, { testValue: 'This is a test Value' }));
  }
  await Promise.all(promises);
  console.timeEnd('LotsofRecords-PAll');
};

test();

/*
console.time('DeleteAll');
const arrPromises = myColl.deleteAll();
Promise.all(arrPromises).then(() => {
  console.timeEnd('DeleteAll');
});
*/

process.on('unhandledRejection', err => {
  console.error('Uncaught Promise Error: ', err);
});

