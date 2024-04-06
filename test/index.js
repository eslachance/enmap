/* global describe, test, beforeEach, afterEach, expect, beforeAll */
import Enmap from '../';
const enmap = new Enmap({ inMemory: true });

describe('Standard Enmaps', () => {
  beforeAll(() => {
    enmap.clear();
  })
  describe('Basic Enmap', () => {
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
    test('can delete values', () => {
      enmap.delete('simplevalue');
      expect(enmap.get('simplevalue')).toBe(null);
    });
    test('can be cleared', () => {
      enmap.clear();
      expect(enmap.length).toBe(0);
    });
  });

  describe('Advanced Data Types', () => {
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

    test('deleting data', () => {
      enmap.delete('serialized', 'str');
      expect(enmap.get('serialized', 'str')).toBeUndefined();
      enmap.delete('serialized', 'obj.foo');
      expect(enmap.get('serialized', 'obj.foo')).toBeUndefined();
      enmap.delete('serialized');
      expect(enmap.get('serialized')).toBeNull();
    });
  });
});

describe('Advanced Data Type Methods', () => {
  beforeAll(() => {
    enmap.clear();
  });
  beforeEach(() => {
    enmap.clear();
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

describe('partition', () => {
  beforeAll(() => {
    enmap.clear();
    for (let i = 0; i < 10; i++) {
      enmap.set(`${i}`, {
        number: i,
        isEven: i % 2 === 0,
      });
    };
  });

  test('partition by function', () => {
    const partitioned = enmap.partition((value) => {
      return value.number % 2 === 0;
    });
    expect(partitioned[0].length).toBe(5);
    expect(partitioned[1].length).toBe(5);
  });

  test('partition by property', () => {
    const partitioned = enmap.partition('isEven', true);
    expect(partitioned[0].length).toBe(5);
    expect(partitioned[1].length).toBe(5);
  });
});

describe('Enmap Observables', () => {
  // This entire set of test was written by Copilot. What do you think?

  beforeAll(() => {
    enmap.clear();
    enmap.set('test', {
      a: 1,
      b: 2,
      c: 3,
      d: [1, 2, 3, 4],
      e: { a: 'a', b: 'b', c: 'c' },
    });
  });

  test('can observe a value', () => {
    const obj = enmap.observe('test');
    expect(obj.a).toBe(1);
    obj.a = 2;
    expect(enmap.get('test', 'a')).toBe(2);
  });

  test('can observe a subproperty', () => {
    const obj = enmap.observe('test', 'e');
    expect(obj.a).toBe('a');
    obj.a = 'b';
    expect(enmap.get('test', 'e.a')).toBe('b');
  });

  test('can observe an array', () => {
    const arr = enmap.observe('test', 'd');
    expect(arr.length).toBe(4);
    arr.push(5);
    expect(enmap.get('test', 'd').length).toBe(5);
  });

  test('can observe a subproperty of an array', () => {
    const arr = enmap.observe('test', 'd');
    const obj = arr[0];
    expect(obj).toBe(1);
    arr[0] = 2;
    expect(enmap.get('test', 'd.0')).toBe(2);
  });
});

describe('sweep', () => {
  beforeEach(() => {
    enmap.clear();
    for (let i = 0; i < 10; i++) {
      enmap.set(`${i}`, {
        number: i,
        isEven: i % 2 === 0,
      });
    };
  });
  test('sweep by function', () => {
    enmap.sweep((value) => {
      return value.number % 2 === 0;
    });
    expect(enmap.size).toBe(5);
  });

  test('sweep by property', () => {
    enmap.sweep('isEven', false);
    expect(enmap.size).toBe(5);
  });
});

describe('Basic Enmap Options', () => {
  const localEnmap = new Enmap({ inMemory : true, ensureProps: true });
  test('supports deep ensure() merge', () => {
    const defaultValue = {
      foo: 'bar',
      bar: { foo: 1 },
    };
    localEnmap.set('obj', {});
    localEnmap.ensure('obj', defaultValue);
    expect(localEnmap.get('obj', 'bar.foo')).toBe(1);
  });
});

describe('Enmap Advanced Options', () => {
  class ExampleClass {
    constructor(id) {
      this.id = id;
    }
  }
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
    defaultData.c = new ExampleClass(3);
    enmap = new Enmap({
      inMemory: true,
      serializer: (data) => ({
        ...data,
        a: 'modified',
        c: data.c.id,
      }),
      deserializer: (data) => ({
        ...data,
        a: 1,
        c: new ExampleClass(data.c),
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
