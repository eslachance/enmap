import {
  describe,
  test,
  expect,
  vi,
} from 'vitest';
import { parse, stringify } from 'better-serialize';
import Enmap from '../src/index.ts';
import { mkdir, rm } from 'fs/promises';
import CustomError from '../src/error.ts';

describe('Enmap', () => {
  process.setMaxListeners(100);

  describe('can instantiate', () => {
    test('should create an Enmap', () => {
      const enmap = new Enmap({ inMemory: true });

      expect(enmap).toBeInstanceOf(Enmap);
    });

    test('should create an Enmap w/ warning', () => {
      const spy = vi.spyOn(console, 'warn');

      const enmap = new Enmap({ name: '::memory::' });

      expect(enmap).toBeInstanceOf(Enmap);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('should create an Enmap w/ custom serializing', () => {
      const enmap = new Enmap({
        inMemory: true,
        serializer: JSON.stringify,
        deserializer: JSON.parse,
      });

      expect(enmap).toBeInstanceOf(Enmap);
    });

    test('should close database on exit', () => {
      let callback;
      process.on = (event, cb) => {
        if (event === 'exit') {
          callback = cb;
        }
      };

      const enmap = new Enmap({ inMemory: true });

      callback();

      expect(enmap.db.open).toBe(false);
    });

    test('should create a persistent Enmap w/ dir', async () => {
      await mkdir('./tmp').catch(() => {});

      const enmap = new Enmap({ name: 'test', dataDir: './tmp' });

      expect(enmap).toBeInstanceOf(Enmap);
    });

    test('should load a persistent Enmap w/ dir', () => {
      const enmap = new Enmap({ name: 'test', dataDir: './tmp' });

      expect(enmap).toBeInstanceOf(Enmap);
    });

    test('should fail to create a persistent Enmap w/o dir', async () => {
      expect(
        () => new Enmap({ name: 'test', dataDir: './data-not-found' }),
      ).toThrow(TypeError);
    });

    test('should create/use data dir', async () => {
      await rm('./data', { recursive: true }).catch(() => {});

      const enmap = new Enmap({ name: 'test' });
      const enmap2 = new Enmap({ name: 'test' });

      expect(enmap).toBeInstanceOf(Enmap);
      expect(enmap2).toBeInstanceOf(Enmap);
    });
  });

  describe('should manipulate data', () => {
    describe('set', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should set a value w/ string', () => {
        enmap.set('setString', 'value');

        expect(enmap.get('setString')).toBe('value');
      });

      test('should set a value w/ object', () => {
        enmap.set('setObject', { value: 'value' });

        expect(enmap.get('setObject')).toEqual({ value: 'value' });
      });

      test('should set a value w/ array', () => {
        enmap.set('setArray', ['value']);

        expect(enmap.get('setArray')).toEqual(['value']);
      });

      test('should set a value w/ number', () => {
        enmap.set('setNumber', 1);

        expect(enmap.get('setNumber')).toBe(1);
      });

      test('should set a value w/ null', () => {
        enmap.set('setNull', null);

        expect(enmap.get('setNull')).toBe(null);
      });

      test('should set a value w/ boolean', () => {
        enmap.set('setBool', true);

        expect(enmap.get('setBool')).toBe(true);
      });

      test('should set a value w/ BigInt', () => {
        enmap.set('setBigInt', BigInt(1));

        expect(enmap.get('setBigInt')).toBe(BigInt(1));
      });

      test('should set a value w/ path', () => {
        enmap.set('setPath', 'value', 'sub');

        expect(enmap.get('setPath', 'sub')).toBe('value');
      });

      test('should fail to set a value w/ invalid key', () => {
        expect(() => enmap.set([], {}, () => {})).toThrow(
          `Invalid key for enmap - keys must be a string.`,
        );
        // I don't know what happened that made me think this wasn't valid...
        enmap.set('$', 'Dollar signs are accepted');
        expect(enmap.get('$')).toBe('Dollar signs are accepted');
      });

      test('should call callback after set', () => {
        const mock = vi.fn();
        enmap.changed(mock);
        enmap.set('setCallback', 'value', 'sub');
        expect(mock).toHaveBeenCalledTimes(1);
        expect(enmap.get('setCallback', 'sub')).toBe('value');
      });
    });

    describe('update', () => {
      const enmap = new Enmap({ inMemory: true });
      test('should update a value w/ object', () => {
        enmap.set('updateObj', { value: 'value' });

        enmap.update('updateObj', { value: 'new' });

        expect(enmap.get('updateObj')).toEqual({ value: 'new' });
      });

      test('should update a value w/ function', () => {
        enmap.set('updateFunc', { value: 1 });

        enmap.update('updateFunc', (val) => {
          return { value: val.value + 1 };
        });

        expect(enmap.get('updateFunc')).toEqual({ value: 2 });
      });
    });

    describe('get', () => {
      const enmap = new Enmap({ inMemory: true });
      const defaultEnmap = new Enmap({
        inMemory: true,
        autoEnsure: { hello: 'world' },
      });

      test('should get a value', () => {
        enmap.set('get', 'value');

        expect(enmap.get('get')).toBe('value');
      });

      test('should get a value w/ path', () => {
        enmap.set('getPath', 'value', 'sub');

        expect(enmap.get('getPath', 'sub')).toBe('value');
      });

      test('should get a value w/ default', () => {
        expect(defaultEnmap.get('unknown')).toEqual({ hello: 'world' });
      });

      test('should get a value w/ default', () => {
        expect(defaultEnmap.get('unknown', 'hello')).toBe('world');
      });
    });

    describe('observe', () => {
      const enmap = new Enmap({ inMemory: true });
      test('should observe a value', () => {
        enmap.set('observe', { value: 'value' });
        const observer = enmap.observe('observe');

        expect(observer).toEqual({ value: 'value' });

        observer.value = 'new';

        expect(enmap.get('observe')).toEqual({ value: 'new' });
        expect(observer).toEqual({ value: 'new' });
      });
    });

    describe('size', () => {
      const enmap = new Enmap({ inMemory: true });
      test('should get size', () => {
        enmap.set('size', 'value');

        expect(enmap.size).toBe(1);
        expect(enmap.count).toBe(1);
        expect(enmap.length).toBe(1);
      });
    });

    describe('keys', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should get keys', () => {
        enmap.set('keys', 'value');
        expect(enmap.keys()).toEqual(['keys']);
        expect(enmap.indexes()).toEqual(['keys']);
      });
    });

    describe('values', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should get values', () => {
        enmap.set('values', 'value');
        expect(enmap.values()).toEqual(['value']);
      });
    });

    describe('entries', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should get entries', () => {
        enmap.set('entries', 'value');
        expect(enmap.entries()).toEqual([['entries', 'value']]);
      });
    });

    describe('autonum', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should autonum', () => {
        expect(enmap.autonum).toBe('1');
        expect(enmap.autonum).toBe('2');
      });
    });

    describe('push', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should push value', () => {
        enmap.set('push', []);
        enmap.push('push', 'value');

        expect(enmap.get('push')).toEqual(['value']);
      });

      test('should not push duplicate value', () => {
        enmap.set('pushDup', ['value']);
        enmap.push('pushDup', 'value');

        expect(enmap.get('pushDup')).toEqual(['value']);
      });

      test('should push duplicate value', () => {
        enmap.set('pushDup2', ['value']);
        enmap.push('pushDup2', 'value', null, true);

        expect(enmap.get('pushDup2')).toEqual(['value', 'value']);
      });

      test('should fail to push value w/ path to string', () => {
        enmap.set('pushObjStr', { sub: '' });
        expect(() => enmap.push('pushObjStr', 'value', 'sub')).toThrow(
          new CustomError('Key does not point to an array', 'EnmapPathError'),
        );
      });

      test('should push value w/ path', () => {
        enmap.set('pushObj', { sub: [] });
        enmap.push('pushObj', 'value', 'sub');

        expect(enmap.get('pushObj', 'sub')).toEqual(['value']);
      });
    });

    describe('math', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should fail w/o base/op/opand', () => {
        enmap.set('math', 1);

        expect(() => enmap.math('math')).toThrow(
          new CustomError(
            'Math Operation requires base and operation',
            'EnmapTypeError',
          ),
        );
      });

      test('should add value', () => {
        enmap.set('simplevalue', 1);
        enmap.math('simplevalue', '+', 1);
        enmap.math('simplevalue', 'add', 1);
        enmap.math('simplevalue', 'addition', 1);

        expect(enmap.get('simplevalue')).toBe(4);
      });

      test('should subtract value', () => {
        enmap.set('simplevalue', 1);
        enmap.math('simplevalue', '-', 1);
        enmap.math('simplevalue', 'sub', 1);
        enmap.math('simplevalue', 'subtract', 1);

        expect(enmap.get('simplevalue')).toBe(-2);
      });

      test('should multiply value', () => {
        enmap.set('simplevalue', 2);
        enmap.math('simplevalue', '*', 2);
        enmap.math('simplevalue', 'mult', 2);
        enmap.math('simplevalue', 'multiply', 2);

        expect(enmap.get('simplevalue')).toBe(16);
      });

      test('should divide value', () => {
        enmap.set('simplevalue', 4);
        enmap.math('simplevalue', '/', 2);
        enmap.math('simplevalue', 'div', 2);
        enmap.math('simplevalue', 'divide', 2);

        expect(enmap.get('simplevalue')).toBe(0.5);
      });

      test('should exponent value', () => {
        enmap.set('simplevalue', 2);
        enmap.math('simplevalue', '^', 2);
        enmap.math('simplevalue', 'exp', 2);
        enmap.math('simplevalue', 'exponent', 2);

        expect(enmap.get('simplevalue')).toBe(256);
      });

      test('should modulo value', () => {
        enmap.set('simplevalue', 5);
        enmap.math('simplevalue', '%', 2);
        enmap.math('simplevalue', 'mod', 2);
        enmap.math('simplevalue', 'modulo', 2);

        expect(enmap.get('simplevalue')).toBe(1);
      });

      test('should random value', () => {
        enmap.set('rand', 1);
        enmap.math('rand', 'rand', 1);

        expect(enmap.get('rand')).toBeGreaterThanOrEqual(0);
        expect(enmap.get('rand')).toBeLessThanOrEqual(1);
      });

      test('should null value', () => {
        enmap.set('huh', 1);
        enmap.math('huh', 'huh', 1);

        expect(enmap.get('huh')).toBe(null);
      });

      test('should math value w/ path', () => {
        enmap.set('pathobj', { a: 1 });
        enmap.math('pathobj', 'sub', 1, 'a');
        expect(enmap.get('pathobj')).toEqual({ a: 0 });
        enmap.inc('pathobj', 'a');
        expect(enmap.get('pathobj')).toEqual({ a: 1 });
        enmap.dec('pathobj', 'a');
        expect(enmap.get('pathobj')).toEqual({ a: 0 });
      });
    });

    describe('inc', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should increment value', () => {
        enmap.set('inc', 1);
        enmap.inc('inc');

        expect(enmap.get('inc')).toBe(2);
      });
    });

    describe('dec', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should decrement value', () => {
        enmap.set('dec', 1);
        enmap.dec('dec');

        expect(enmap.get('dec')).toBe(0);
      });
    });

    describe('ensure', () => {
      const enmap = new Enmap({ inMemory: true });
      const defaultEnmap = new Enmap({
        inMemory: true,
        autoEnsure: { hello: 'world' },
      });

      test('should ensure value', () => {
        enmap.ensure('ensure', 'value');

        expect(enmap.get('ensure')).toBe('value');
      });

      test('should ensure value w/ existing value', () => {
        enmap.set('ensureExisting', 'value2');
        enmap.ensure('ensureExisting', 'value');

        expect(enmap.get('ensureExisting')).toBe('value2');
      });

      test('should ensure value w/ default', () => {
        expect(defaultEnmap.ensure('unknown')).toEqual({ hello: 'world' });
      });

      test('should ensure value w/ path', () => {
        enmap.ensure('ensurePath', 'value', 'sub');

        expect(enmap.get('ensurePath', 'sub')).toBe('value');
      });

      test('should ensure value w/ existing path', () => {
        enmap.set('ensurePathExisting', { sub: 'value2' });
        enmap.ensure('ensurePathExisting', 'value', 'sub');

        expect(enmap.get('ensurePathExisting', 'sub')).toBe('value2');
      });

      test('should fail to ensure string w/ object value', () => {
        enmap.set('ensureObj', { value: 'value' });

        expect(() => enmap.ensure('ensureObj', 'value')).toThrow(
          new CustomError(
            'Default value for "ensureObj" in enmap "MemoryEnmap" must be an object when merging with an object value.',
            'EnmapArgumentError',
          ),
        );
      });

      test('should ignore + warn ensure value w/ default', () => {
        const spy = vi.spyOn(process, 'emitWarning');

        expect(defaultEnmap.ensure('unknown', 'hello')).toEqual({
          hello: 'world',
        });

        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    describe('has', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should return true if key exists', () => {
        enmap.set('has', 'value');

        expect(enmap.has('has')).toBe(true);
      });

      test("should return false if key doesn't exist", () => {
        expect(enmap.has('unknown')).toBe(false);
      });
    });

    describe('includes', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should return true w/ value', () => {
        enmap.set('includes', ['value']);

        expect(enmap.includes('includes', 'value')).toBe(true);
      });

      test('should return false w/o value', () => {
        enmap.set('includes', ['value']);

        expect(enmap.includes('includes', 'value2')).toBe(false);
      });
    });

    describe('delete', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should delete a key', () => {
        enmap.set('delete', 'value');
        enmap.delete('delete');

        expect(enmap.get('delete')).toBe(null);
      });

      test('should delete a path', () => {
        enmap.set('deletePath', 'value', 'sub');
        enmap.delete('deletePath', 'sub');

        expect(enmap.get('deletePath', 'sub')).toBe(undefined);
      });
    });

    describe('clear', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should clear all keys', () => {
        enmap.set('clear', 'value');
        enmap.clear();

        expect(enmap.get('clear')).toBe(null);
      });
    });

    describe('remove', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should remove a value', () => {
        enmap.set('remove', ['value']);
        enmap.remove('remove', 'value');

        expect(enmap.get('remove')).toEqual([]);
      });

      test('should remove a value w/ function', () => {
        enmap.set('remove', ['value', 'value2']);
        enmap.remove('remove', (val) => val === 'value');

        expect(enmap.get('remove')).toEqual(['value2']);
      });

      test('should remove a value w/ path', () => {
        enmap.set('removePath', { sub: ['value'] });
        enmap.remove('removePath', 'value', 'sub');

        expect(enmap.get('removePath', 'sub')).toEqual([]);
      });
    });

    describe('export', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should export data', () => {
        enmap.set('export', 'value');

        const output = enmap.export();

        expect(parse(output)).toMatchObject({
          name: 'MemoryEnmap',
          exportDate: expect.any(Number),
          version: expect.any(String),
          keys: [{ key: 'export', value: stringify('value') }],
        });
      });
    });

    describe('import', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should import data', () => {
        enmap.import(
          JSON.stringify({
            name: 'MemoryEnmap',
            exportDate: Date.now(),
            version: '1.0.0',
            keys: [{ key: 'import', value: stringify({ hello: 'world' }) }],
          }),
        );

        expect(enmap.get('import')).toEqual({ hello: 'world' });
      });

      test('should import data w/o overwrite', () => {
        enmap.set('import', 'value');
        enmap.import(
          JSON.stringify({
            name: 'MemoryEnmap',
            exportDate: Date.now(),
            version: '1.0.0',
            keys: [{ key: 'import', value: stringify({ hello: 'world' }) }],
          }),
          false,
        );

        expect(enmap.get('import')).toBe('value');
      });

      test('should import data w/ clear w/o overwrite', () => {
        enmap.set('import', 'value');

        enmap.import(
          JSON.stringify({
            name: 'MemoryEnmap',
            exportDate: Date.now(),
            version: '1.0.0',
            keys: [{ key: 'import', value: stringify({ hello: 'world' }) }],
          }),
          false,
          true,
        );

        expect(enmap.get('import')).toEqual({ hello: 'world' });
      });

      test('should fail to import invalid data', () => {
        expect(() => enmap.import('invalid')).toThrow(
          new CustomError('Data provided is not valid JSON', 'EnmapDataError'),
        );
      });

      test('should fail to import null data', () => {
        expect(() => enmap.import('null')).toThrow(
          new CustomError(
            'No data provided for import() in "MemoryEnmap"',
            'EnmapImportError',
          ),
        );
      });
    });

    describe('multi', () => {
      test('should create multiple Enmaps', () => {
        const enmaps = Enmap.multi(['multi1', 'multi2'], { inMemory: true });

        expect(enmaps).toEqual({
          multi1: expect.any(Enmap),
          multi2: expect.any(Enmap),
        });
      });

      test('should fail to create empty', () => {
        expect(() => Enmap.multi([])).toThrow(
          new CustomError(
            '"names" argument must be an array of string names.',
            'EnmapTypeError',
          ),
        );
      });
    });

    describe('random', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should get random value', () => {
        enmap.set('random', 'value');

        expect(enmap.random()).toEqual([['random', 'value']]);
      });

      test('should get random value w/ count', () => {
        enmap.set('random', 'value');

        expect(enmap.random(2).length).toBe(1);

        enmap.set('random2', 'value');

        expect(enmap.random(2).length).toBe(2);
      });
    });

    describe('randomKey', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should get random key', () => {
        enmap.set('random', 'value');

        expect(enmap.randomKey()).toEqual(['random']);
      });

      test('should get random key w/ count', () => {
        enmap.set('random', 'value');

        expect(enmap.randomKey(2).length).toBe(1);

        enmap.set('random2', 'value');

        expect(enmap.randomKey(2).length).toBe(2);
      });
    });

    describe('every', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should return true for all values w/ value', () => {
        enmap.set('every', 'value');
        enmap.set('every2', 'value');

        expect(enmap.every('value')).toBe(true);
      });

      test('should return true for all value w/ function', () => {
        enmap.set('every', 'value');
        enmap.set('every2', 'value');

        expect(enmap.every((val) => val === 'value')).toBe(true);
      });

      test('should return false for all values w/o value', () => {
        enmap.set('every', 'value');
        enmap.set('every2', 'value2');

        expect(enmap.every('value')).toBe(false);
      });

      test('should return false for all value w/ function', () => {
        enmap.set('every', 'value');
        enmap.set('every2', 'value2');

        expect(enmap.every((val) => val === 'value')).toBe(false);
      });

      test('should return false for all values w/ path', () => {
        enmap.set('every', { sub: 'value' });
        enmap.set('every2', { sub: 'value2' });

        expect(enmap.every('value', 'sub')).toBe(false);
      });

      test('should return true for all values w/ path', () => {
        enmap.set('every', { sub: 'value' });
        enmap.set('every2', { sub: 'value' });

        expect(enmap.every('value', 'sub')).toBe(true);
      });
    });

    describe('some', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should return true for some values w/ value', () => {
        enmap.set('some', 'value');
        enmap.set('some2', 'value2');

        expect(enmap.some('value')).toBe(true);
      });

      test('should return true for some value w/ function', () => {
        enmap.set('some', 'value');
        enmap.set('some2', 'value2');

        expect(enmap.some((val) => val === 'value')).toBe(true);
      });

      test('should return false for some values w/o value', () => {
        enmap.set('some', 'value');
        enmap.set('some2', 'value2');

        expect(enmap.some('value3')).toBe(false);
      });

      test('should return false for some value w/ function', () => {
        enmap.set('some', 'value');
        enmap.set('some2', 'value2');

        expect(enmap.some((val) => val === 'value3')).toBe(false);
      });

      test('should return false for some values w/ path', () => {
        enmap.set('some', { sub: 'value' });
        enmap.set('some2', { sub: 'value2' });

        expect(enmap.some('value', 'sub')).toBe(true);
      });

      test('should return true for some values w/ path', () => {
        enmap.set('some', { sub: 'value' });
        enmap.set('some2', { sub: 'value' });

        expect(enmap.some('value', 'sub')).toBe(true);
      });
    });

    describe('map', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should map values', () => {
        enmap.set('map', 'value');
        enmap.set('map2', 'value2');

        expect(enmap.map((val) => val)).toEqual(['value', 'value2']);
      });

      test('should map values w/ path', () => {
        enmap.set('map', { sub: 'value' });
        enmap.set('map2', { sub: 'value2' });

        expect(enmap.map('sub')).toEqual(['value', 'value2']);
      });
    });

    describe('find', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should find value', () => {
        enmap.set('find', 'value');
        enmap.set('find2', 'value2');

        expect(enmap.find((val) => val === 'value')).toBe('value');
      });

      test('should find value w/ path', () => {
        enmap.set('find', { sub: 'value' });
        enmap.set('find2', { sub: 'value2' });

        expect(enmap.find('sub', 'value')).toEqual({ sub: 'value' });
      });

      test('should return null if not found', () => {
        enmap.set('find', 'value');
        enmap.set('find2', 'value2');

        expect(enmap.find((val) => val === 'value3')).toBe(null);
      });
    });

    describe('findIndex', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should find index', () => {
        enmap.set('find', 'value');
        enmap.set('find2', 'value2');

        expect(enmap.findIndex((val) => val === 'value')).toBe('find');
      });

      test('should find index w/ path', () => {
        enmap.set('find', { sub: 'value' });
        enmap.set('find2', { sub: 'value2' });

        expect(enmap.findIndex('sub', 'value')).toBe('find');
      });

      test('should return null if not found', () => {
        enmap.set('find', 'value');
        enmap.set('find2', 'value2');

        expect(enmap.findIndex((val) => val === 'value3')).toBe(null);
      });
    });

    describe('reduce', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should reduce values', () => {
        enmap.set('reduce', 1);
        enmap.set('reduce2', 2);

        expect(enmap.reduce((acc, val) => acc + val, 0)).toBe(3);
      });

      test('should reduce values w/ path', () => {
        enmap.set('reduce', { sub: 1 });
        enmap.set('reduce2', { sub: 2 });

        expect(enmap.reduce((acc, val) => acc + val.sub, 0)).toBe(3);
      });
    });

    describe('filter', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should filter values', () => {
        enmap.set('filter', 'value');
        enmap.set('filter2', 'value2');

        expect(enmap.filter((val) => val === 'value')).toEqual(['value']);
      });

      test('should filter values w/ path', () => {
        enmap.set('filter', { sub: 'value' });
        enmap.set('filter2', { sub: 'value2' });

        expect(enmap.filter('sub', 'value')).toEqual([{ sub: 'value' }]);
      });

      test('should fail to filter w/o value', () => {
        enmap.set('filter', 'value');
        enmap.set('filter2', 'value2');

        expect(() => enmap.filter('value')).toThrow(
          new CustomError(
            'Value is required for non-function predicate',
            'EnmapValueError',
          ),
        );
      });
    });

    describe('sweep', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should sweep values', () => {
        enmap.set('sweep', 'value');
        enmap.set('sweep2', 'value2');

        expect(enmap.sweep((val) => val === 'value')).toEqual(1);
      });

      test('should sweep values w/ path', () => {
        enmap.set('sweep', { sub: 'value' });
        enmap.set('sweep2', { sub: 'value2' });

        expect(enmap.sweep('sub', 'value')).toEqual(1);
      });

      test('should sweep values w/ function', () => {
        enmap.set('sweep', 'value');
        enmap.set('sweep2', 'value2');

        expect(enmap.sweep((val) => val === 'value')).toEqual(1);
      });
    });

    describe('partition', () => {
      const enmap = new Enmap({ inMemory: true });

      test('should partition values', () => {
        enmap.set('partition', 'value');
        enmap.set('partition2', 'value2');

        expect(enmap.partition((val) => val === 'value')).toEqual([
          ['value'],
          ['value2'],
        ]);
      });

      test('should partition values w/ path', () => {
        enmap.set('partition', { sub: 'value' });
        enmap.set('partition2', { sub: 'value2' });

        expect(enmap.partition('sub', 'value')).toEqual([
          [{ sub: 'value' }],
          [{ sub: 'value2' }],
        ]);
      });
    });
  });
});
