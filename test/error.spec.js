import { describe, expect, test } from 'vitest';
import CustomError from '../src/error';

describe('CustomError', () => {
  test('should create an instance of CustomError', () => {
    const error = new CustomError('An error occurred');
    expect(error).toBeInstanceOf(CustomError);
  });

  test('should have a default name of "EnmapError"', () => {
    const error = new CustomError('An error occurred');
    expect(error.name).toBe('EnmapError');
  });

  test('should use the provided name if given', () => {
    const error = new CustomError('An error occurred', 'CustomErrorName');
    expect(error.name).toBe('CustomErrorName');
  });

  test('should have the correct message', () => {
    const message = 'An error occurred';
    const error = new CustomError(message);
    expect(error.message).toBe(message);
  });

  test('should capture the stack trace', () => {
    const error = new CustomError('An error occurred');
    expect(error.stack).toContain('EnmapError'); // Ensuring stack trace includes 'CustomError'
  });
});
