/* global describe, it, before */
const assert = require('assert');
const Enmap = require('../');

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
  let enmap;
  before(async () => {
    enmap = new Enmap({ name: 'testing', persistent: true });
    return enmap.defer;
  });

  describe('Loading Persistent Data', () => {
    it('can load existing data', () => {
      assert.ok(enmap.size);
    });
  });

  describe('Inserting Data', () => {
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
  });
});
