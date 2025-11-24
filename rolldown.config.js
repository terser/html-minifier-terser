import { defineConfig } from 'rolldown';
import nodePolyfills from '@rolldown/plugin-node-polyfills';

export default defineConfig([
  {
    input: 'src/htmlminifier.js',
    platform: 'browser',
    output: {
      file: 'dist/htmlminifier.umd.bundle.js',
      format: 'umd',
      exports: 'named',
      name: 'HTMLMinifier'
    },
    plugins: [nodePolyfills()]
  },
  {
    input: 'src/htmlminifier.js',
    platform: 'browser',
    output: {
      file: 'dist/htmlminifier.umd.bundle.min.js',
      format: 'umd',
      exports: 'named',
      name: 'HTMLMinifier',
      minify: true
    },
    plugins: [nodePolyfills()]
  },
  {
    input: 'src/htmlminifier.js',
    platform: 'neutral',
    output: {
      file: 'dist/htmlminifier.esm.bundle.js',
      format: 'esm'
    },
    external: ['clean-css', 'terser', 'entities', 'relateurl']
  },
  {
    input: 'src/htmlminifier.js',
    platform: 'node',
    output: {
      file: 'dist/htmlminifier.cjs',
      format: 'cjs',
      exports: 'named'
    },
    external: ['clean-css', 'terser', 'entities', 'relateurl']
  }
]);
