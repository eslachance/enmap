const Enmap = require('../');
const myColl = new Enmap();

console.time("500,000 Records");
for (let i = 0; i < 500000; i++) {
  myColl.set(`test${i}`, { testValue: 'This is a test Value' });
}
console.timeEnd("500,000 Records");

console.log(`There are in fact ${myColl.size} records inserted.`);
