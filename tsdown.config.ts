import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    format: ['umd'],
    platform: 'browser',
    outputOptions: {
      file: 'dist/htmlminifier.umd.bundle.js',
      name: 'HTMLMinifier'
    },
  },
  {
    format: ['umd'],
    platform: 'browser',
    outputOptions: {
      file: 'dist/htmlminifier.umd.bundle.min.js',
      name: 'HTMLMinifier',
      minify: true
    },
  },
  {
    format: ['esm', 'cjs'],
  },
]);
