/* global describe, test, beforeEach, afterEach, expect */
import Enmap from '../';

describe('Standard Enmaps', () => {
  let enmap;

  describe('Basic Enmap', () => {
    enmap = new Enmap({ inMemory : true });
    test('inserts primitive values', () => {
      expect(enmap.set('simplevalue', 'this is a string')).not.toBe(null);
      expect(enmap.set('boolean', true)).not.toBe(null);
      expect(enmap.set('integer', 42)).not.toBe(null);
      expect(enmap.set('null', null)).not.toBe(null);
    });
    test('remembers primitive values', () => {
      expect(enmap.length).toBe(4);
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
    test('can see if a value exists', () => {
      expect(enmap.has('simplevalue')).toBe(true);
      expect(enmap.has('nonexistent')).toBe(false);
    });
    test('can be cleared', () => {
      enmap.clear();
      expect(enmap.length).toBe(0);
    });
  });

  describe('Advanced Data Types', () => {
    enmap = new Enmap({ inMemory : true });

    test('supports arrays', () => {
      expect(enmap.set('array', [1, 2, 3])).not.toBe(null);
      expect(enmap.get('array').length).toBe(3);
      expect(enmap.set('objectarray', [{ a: 1, b: 2, c: 3 }, { d: 4, e: 5, f: 6 }])).not.toBe(null);
      expect(enmap.get('objectarray').length).toBe(2);
    });

    test('also supports objects', () => {
      expect(enmap.set('object', { color: 'black', action: 'paint', desire: true })).not.toBe(null);
      expect(enmap.get('object')).toEqual({ color: 'black', action: 'paint', desire: true });
    });

    test('can get an object by property name', () => {
      expect(enmap.get('object', 'color')).toBe('black');
      expect(enmap.get('object', 'desire')).toBe(true);
      expect(enmap.get('object', 'action')).toBe('paint');
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
      expect(enmap.remove('objectarray', (value) => value.e === 5)).not.toBe(null);
      expect(enmap.get('objectarray').length).toBe(1);
    });

    test('supports simple observables', () => {
      const obj = enmap.observe('object');
      obj.sub.sub2.push('blah');
      expect(obj.sub.sub2[0]).toBe('blah');
      expect(enmap.get('object', 'sub.sub2.0')).toBe('blah');
    });

    test('supports full serialized data', () => {
      enmap.set('serialized', {
        str: 'string',
        num: 0,
        obj: { foo: 'foo' },
        arr: [1, 2, 3],
        bool: true,
        nil: null,
        undef: undefined,
        inf: Infinity,
        date: new Date('Thu, 28 Apr 2016 22:02:17 GMT'),
        map: new Map([['hello', 'world']]),
        set: new Set([123, 456]),
        re: /([^\s]+)/g,
        // eslint-disable-next-line no-undef
        big: BigInt(10),
      });
      expect(enmap.get('serialized', 'undef')).toBeUndefined();
      expect(enmap.get('serialized', 'map').get('hello')).toBe('world');
    });
  });
});

describe('Advanced Data Type Methods', () => {
  let enmap;
  beforeEach(() => {
    enmap = new Enmap({ inMemory : true });
    enmap.set('obj1', {
      prop: 'prop',
      foo: 'bar',
      sub: { value: 'subvalue' },
      arr: [1, 2, 3],
    });
    enmap.set('obj2', {
      prop: 'prop',
      foo: 'phar',
      sub: { value: 'subvalue' },
    });
    enmap.set('arr1', ['one', 'two', 3, 4]);
  });

  test('can filter using both properties and path', () => {
    expect(enmap.filter('prop', 'prop').length).toBe(2);
    expect(enmap.filter('sub.value', 'subvalue').length).toBe(2);
    expect(enmap.filter(value => value?.foo?.includes('pha')).length).toBe(1);
  });

  test('can find using both properties and path', () => {
    expect(enmap.find('sub.value', 'subvalue')).toEqual({
      prop: 'prop',
      foo: 'bar',
      sub: { value: 'subvalue' },
      arr: [1, 2, 3],
    });
  });

  test('can check if value includes', () => {
    expect(enmap.includes('arr1', 'one')).toBe(true);
    expect(enmap.includes('arr1', 3)).toBe(true);
    expect(enmap.includes('arr1', 'three')).toBe(false);
    expect(enmap.includes('obj1', 2, 'arr')).toBe(true);
  });

  test('can iterate over truthy/falsey predicates', () => {
    enmap.delete('arr1');
    enmap.set('obj3', { prop: 'prop' });
    expect(enmap.some('prop', 'prop')).toBe(true);
    expect(enmap.some('notprop', 'prop')).toBe(false);
    expect(enmap.every('prop', 'prop')).toBe(true);
    expect(enmap.every('notprop', 'prop')).toBe(false);
    expect(enmap.some(value => value?.prop === 'prop')).toBe(true);
    expect(enmap.some(value => value?.prop === 'notprop')).toBe(false);
    expect(enmap.every(value => value?.prop === 'prop')).toBe(true);
    expect(enmap.every(value => value?.prop === 'notprop')).toBe(false);
  });

  test('can map over values', () => {
    enmap.delete('arr1');
    const mapped = enmap.map(value => value.prop);
    expect(mapped).toEqual(['prop', 'prop']);
    const manualMapped = enmap.map('prop');
    expect(manualMapped).toEqual(['prop', 'prop']);
    expect(enmap.map('sub.value')).toEqual(['subvalue', 'subvalue']);
  });

  test('can reduce over values', () => {
    const reduced = enmap.reduce((acc, value) => value.prop ? acc + value.prop : acc, '');
    expect(reduced).toBe('propprop');
  });
});

describe('Basic Enmap Options', () => {
  let enmap;

  afterEach(() => {
    enmap.clear();
    enmap = null;
  });

  test('supports deep ensure() merge', () => {
    enmap = new Enmap({ inMemory : true, ensureProps: true });
    const defaultValue = {
      foo: 'bar',
      bar: { foo: 1 },
    };
    enmap.set('obj', {});
    enmap.ensure('obj', defaultValue);
    expect(enmap.get('obj', 'bar.foo')).toBe(1);
  });
});

describe('Enmap Advanced Options', () => {
  let enmap;
  const defaultData = {
    a: 1,
    b: 2,
    c: 3,
    d: [1, 2, 3, 4],
    e: { a: 'a', b: 'b', c: 'c' },
  };
  afterEach(() => {
    enmap.clear();
    enmap = null;
  });

  test('supports autoEnsure', () => {
    enmap = new Enmap({ inMemory: true, autoEnsure: defaultData });
    expect(enmap.get('test')).toEqual(defaultData);
    expect(enmap.length).toBe(1);
    enmap.set('test', 'a', 'a');
    expect(enmap.get('test')).toEqual({
      ...defaultData,
      a: 'a',
    });
    enmap.set('test2', 'b', 'b');
    expect(enmap.get('test2')).toEqual({
      ...defaultData,
      b: 'b',
    });
  });

  test('supports serializers', () => {
    enmap = new Enmap({
      inMemory: true,
      serializer: (data) => ({
        ...data,
        a: 'modified',
      }),
      deserializer: (data) => ({
        ...data,
        a: 1,
      }),
    });
    enmap.set('test', defaultData);
    expect(enmap.get('test', 'a')).toBe(1);
    const data = enmap.db
      .prepare(`SELECT * FROM 'MemoryEnmap' WHERE key = ?;`)
      .get('test');
    expect(data.value).toBe('{"t":0,"v":{"a":{"t":1,"v":"modified"},"b":{"t":2,"v":2},"c":{"t":2,"v":3},"d":{"t":4,"v":[{"t":2,"v":1},{"t":2,"v":2},{"t":2,"v":3},{"t":2,"v":4}]},"e":{"t":0,"v":{"a":{"t":1,"v":"a"},"b":{"t":1,"v":"b"},"c":{"t":1,"v":"c"}}}}}');
  });
});
