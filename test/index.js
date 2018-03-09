/* global describe, it, before */
const assert = require('assert');
const Enmap = require('../');
const Provider = require('enmap-level');
const persistent = new Enmap({ provider: new Provider({ name: 'testing' }) });

describe('Standard Enmaps', () => {
  let enmap;

  before(() => {
    enmap = new Enmap();
  });

  describe('Inserting data', () => {
    it('inserts string values', () => {
      enmap.set('simplevalue', 'this is a string');
    });
    it('inserts other primitives', () => {
      enmap.set('boolean', true);
      enmap.set('integer', 42);
      enmap.set('null', null);
    });
    it('remembers values', () => {
      assert.equal(enmap.get('simplevalue'), 'this is a string');
      assert.equal(enmap.get('integer'), 42);
    });
    it('supports arrays', () => {
      enmap.set('array', [1, 2, 3]);
      assert.equal(enmap.get('array')[2], 3);
    });
    it('also supports objects', () => {
      enmap.set('object', { color: 'black', action: 'paint', desire: true });
      assert.equal(enmap.get('object').color, 'black');
    });
    it('can be cleared', () => {
      enmap.clear();
      assert.equal(enmap.size, 0);
    });
  });
  describe('Performance Tests', () => {
    it('can insert 10,000 records', () => {
      for (let i = 0; i < 10000; i++) {
        enmap.set(`value${i}`, 'simple string');
      }
    });
    it('can delete them too', () => {
      enmap.forEach(item => {
        enmap.delete(item);
      });
    });
    it('can insert 100,000 records', () => {
      for (let i = 0; i < 100000; i++) {
        enmap.set(`value${i}`, 'simple string');
      }
    });
    it('can delete them too', () => {
      enmap.forEach(item => {
        enmap.delete(item);
      });
    });
  });
});

describe('Persistent Enmap', () => {
  before(async () => {
    await persistent.defer;
  });

  describe('Loading Persistent Data', () => {
    it('can load existing data', () => {
      assert.ok(persistent.size);
    });
  });

  describe('Inserting Data', () => {
    it('inserts string values', () => {
      persistent.set('simplevalue', 'this is a string');
    });
    it('inserts other primitives', () => {
      persistent.set('boolean', true);
      persistent.set('integer', 42);
      persistent.set('null', null);
    });
    it('remembers values', () => {
      assert.equal(persistent.get('simplevalue'), 'this is a string');
      assert.equal(persistent.get('integer'), 42);
    });
    it('supports arrays', () => {
      persistent.set('array', [1, 2, 3]);
      assert.equal(persistent.get('array')[2], 3);
    });
    it('also supports objects', () => {
      persistent.set('object', { color: 'black', action: 'paint', desire: true });
      assert.equal(persistent.get('object').color, 'black');
    });
    it('can get a specific object or array property', () => {
      assert.equal(persistent.getProp('object', 'action'), 'paint');
      assert.equal(persistent.getProp('array', 0), 1);
    });
  });
  describe('Performance Tests', () => {
    it('can insert 10,000 records', async () => {
      const promises = [];
      for (let i = 0; i < 10000; i++) {
        promises.push(persistent.setAsync(`test${i}`, 'simple string'));
      }
      await Promise.all(promises);
    });
    it('can delete them too', async () => {
      const promises = [];
      for (let i = 0; i < 10000; i++) {
        promises.push(persistent.deleteAsync(`test${i}`));
      }
      await Promise.all(promises);
    });
    it('can insert 100,000 records', async () => {
      const promises = [];
      for (let i = 0; i < 100000; i++) {
        promises.push(persistent.setAsync(`test${i}`, 'simple string'));
      }
      await Promise.all(promises);
    }).timeout(45000);
    it('can delete them too', async () => {
      const promises = [];
      for (let i = 0; i < 100000; i++) {
        promises.push(persistent.deleteAsync(`test${i}`));
      }
      await Promise.all(promises);
    }).timeout(45000);
  });
});
