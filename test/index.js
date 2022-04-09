/* global describe, test, beforeEach, afterEach, expect */
const Enmap = require('../');

describe('Standard Enmaps', () => {
  let enmap;

  describe('Basic Enmap', () => {
    enmap = new Enmap('::memory::');
    test('inserts primitive values', () => {
      expect(enmap.set('simplevalue', 'this is a string')).not.toBe(null);
      expect(enmap.set('boolean', true)).not.toBe(null);
      expect(enmap.set('integer', 42)).not.toBe(null);
      expect(enmap.set('null', null)).not.toBe(null);
    });
    test('remembers primitive values', () => {
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
    enmap = new Enmap('::memory::');

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
        fn: function echo(arg) { return arg; },
        re: /([^\s]+)/g,
        // eslint-disable-next-line no-undef
        big: BigInt(10),
      });
      expect(enmap.get('serialized', 'undef')).toBeUndefined();
      expect(enmap.get('serialized', 'fn')('test')).toBe('test');
      expect(enmap.get('serialized', 'map').get('hello')).toBe('world');
    });
  });
});

describe('Advanced Data Type Methods', () => {
  let enmap;
  beforeEach(() => {
    enmap = new Enmap('::memory::');
    enmap.set('obj1', {
      prop: 'prop',
      foo: 'bar',
      sub: { value: 'subvalue' },
    });
    enmap.set('obj2', {
      prop: 'prop',
      foo: 'phar',
      sub: { value: 'subvalue' },
    });
    enmap.set('arr1', ['one', 'two', 3, 4]);
  });

  test('can findAll using both properties and path', () => {
    expect(enmap.findAll('prop', 'prop').length).toBe(2);
    expect(enmap.findAll('sub.value', 'subvalue').length).toBe(2);
  });

  test('can find using both properties and path', () => {
    // expect(enmap.find('prop', 'prop')).toEqual({
    //   prop: 'prop',
    //   foo: 'bar',
    //   sub: { value: 'subvalue' }
    // });
    expect(enmap.find('sub.value', 'subvalue')).toEqual({
      prop: 'prop',
      foo: 'bar',
      sub: { value: 'subvalue' },
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
      obj: { thing: 'amajig' },
    };
  });

  afterEach(() => {
    enmap.clear();
    enmap = null;
  });

  test('supports direct passing by reference (cloneLevel none)', () => {
    enmap = new Enmap({ name: '::memory::', cloneLevel: 'none' });
    enmap.set('foo', baseObj);
    enmap.set('foo', 'other', 'prop2');
    enmap.push('foo', 4, 'prop3');
    // by reference modifies object properties at any level.
    expect(baseObj.prop2).toBe('other');
    expect(baseObj.prop3.length).toBe(4);
  });

  test('supports shallow clones', () => {
    enmap = new Enmap({ name: '::memory::', cloneLevel: 'shallow' });
    enmap.set('foo', baseObj);
    enmap.set('foo', 'other', 'prop2');
    enmap.push('foo', 4, 'prop3');
    // shallow clones do not allow base props to change in referenced object
    expect(baseObj.prop2).toBe('thing');
    // shallow clones still allow subprops to be modified, though.
    expect(baseObj.prop3.length).toBe(4);
  });

  test('supports deep clones', () => {
    enmap = new Enmap({ name: '::memory::', cloneLevel: 'deep' });
    enmap.set('foo', baseObj);
    enmap.set('foo', 'other', 'prop2');
    enmap.push('foo', 4, 'prop3');
    // deep clones do not allow base props to change in referenced object
    expect(baseObj.prop2).toBe('thing');
    // deep clones do not allow sub props to be changed, either.
    expect(baseObj.prop3.length).toBe(3);
  });

  test('supports deep ensure() merge', () => {
    enmap = new Enmap({ name: '::memory::', ensureProps: true });
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
    enmap.close();
    enmap = null;
  });
  test('supports autoEnsure', () => {
    enmap = new Enmap({ name: '::memory::', autoEnsure: defaultData });
    expect(enmap.get('test')).toEqual(defaultData);
    expect(enmap.size).toBe(1);
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
      name: '::memory::',
      serializer: (data, key) => ({
        ...data,
        a: 'modified',
      }),
      deserializer: (data, key) => ({
        ...data,
        a: 1,
      }),
    });
    enmap.set('test', defaultData);
    expect(enmap.get('test', 'a')).toBe(1);
    const data = enmap.db
      .prepare(`SELECT * FROM 'MemoryEnmap' WHERE key = ?;`)
      .get('test');
    expect(data.value).toBe('{"a":"modified","b":2,"c":3,"d":[1,2,3,4],"e":{"a":"a","b":"b","c":"c"}}');
  });
});
