import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'lcov', 'clover'],
      exclude: ['scripts', 'coverage'],
      clean: false,
    },
  },
});
