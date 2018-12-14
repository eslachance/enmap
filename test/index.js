/* global describe, test, beforeEach, afterEach, expect */
const Enmap = require('../');

describe('Standard Enmaps', () => {
  let enmap;

  beforeEach(() => {
    // Unused. Kept here for reference.
  });

  describe('Basic Enmap', () => {
    enmap = new Enmap();
    test('inserts primitive values', () => {
      expect(enmap.set('simplevalue', 'this is a string')).not.toBe(null);
      expect(enmap.set('boolean', true)).not.toBe(null);
      expect(enmap.set('integer', 42)).not.toBe(null);
      expect(enmap.set('null', null)).not.toBe(null);
    });
    test('remembers primivitve values', () => {
      expect(enmap.get('simplevalue')).toBe('this is a string');
      expect(enmap.get('boolean')).toBe(true);
      expect(enmap.get('integer')).toBe(42);
      expect(enmap.get('null')).toBe(null);
    });
    test('can do math', () => {
      enmap.inc('integer');
      expect(enmap.get('integer')).toBe(43);
      enmap.math('integer', '+', 5);
      expect(enmap.get('integer')).toBe(48);
      enmap.dec('integer');
      expect(enmap.get('integer')).toBe(47);
    });
    test('can be cleared', () => {
      enmap.clear();
      expect(enmap.size).toBe(0);
    });
  });
  describe('Advanced Data Types', () => {
    enmap = new Enmap();

    test('supports arrays', () => {
      expect(enmap.set('array', [1, 2, 3])).not.toBe(null);
      expect(enmap.get('array').length).toBe(3);
    });

    test('also supports objects', () => {
      expect(enmap.set('object', { color: 'black', action: 'paint', desire: true })).not.toBe(null);
      expect(enmap.get('object')).toEqual({ color: 'black', action: 'paint', desire: true });
    });

    test('can get an object by property name', () => {
      expect(enmap.get('object', 'color')).toBe('black');
      expect(enmap.get('object', 'desire')).toBe(true);
      expect(enmap.getProp('object', 'action')).toBe('paint');
    });

    test('can set subproperties of objects', () => {
      expect(enmap.set('object', { sub1: 'a', sub2: [] }, 'sub')).not.toBe(null);
      expect(enmap.get('object', 'sub.sub1')).toBe('a');
      expect(enmap.get('object', 'sub.sub2').length).toBe(0);
    });

    test('can handle arrays in and out of objects', () => {
      expect(enmap.push('array', 4)).not.toBe(null);
      expect(enmap.get('array').length).toBe(4);
      expect(enmap.remove('array', 1)).not.toBe(null);
      expect(enmap.get('array').length).toBe(3);
      enmap.clear();
      enmap = null;
    });
  });
});

describe('Basic Enmap Options', () => {
  let enmap;
  let baseObj;
  beforeEach(() => {
    baseObj = {
      prop1: false,
      prop2: 'thing',
      prop3: [1, 2, 3],
      obj: { thing: 'amajig' }
    };
  });

  afterEach(() => {
    enmap.clear();
    enmap = null;
  });

  test('supports direct passing by reference (cloneLevel none)', () => {
    enmap = new Enmap({ cloneLevel: 'none' });
    enmap.set('foo', baseObj);
    enmap.set('foo', 'other', 'prop2');
    enmap.push('foo', 4, 'prop3');
    // by reference modifies object properties at any level.
    expect(baseObj.prop2).toBe('other');
    expect(baseObj.prop3.length).toBe(4);
  });

  test('supports shallow clones', () => {
    enmap = new Enmap({ cloneLevel: 'shallow' });
    enmap.set('foo', baseObj);
    enmap.set('foo', 'other', 'prop2');
    enmap.push('foo', 4, 'prop3');
    // shallow clones do not allow base props to change in referenced object
    expect(baseObj.prop2).toBe('thing');
    // shallow clones still allow subprops to be modified, though.
    expect(baseObj.prop3.length).toBe(4);
  });

  test('supports deep clones', () => {
    enmap = new Enmap({ cloneLevel: 'deep' });
    enmap.set('foo', baseObj);
    enmap.set('foo', 'other', 'prop2');
    enmap.push('foo', 4, 'prop3');
    // deep clones do not allow base props to change in referenced object
    expect(baseObj.prop2).toBe('thing');
    // deep clones do not allow sub props to be changed, either.
    expect(baseObj.prop3.length).toBe(3);
  });
});
// @TODO Options testing
// @TODO performance testing
