import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';

const config = defineConfig([
  {
    input: 'src/index.js',
    output: [{
      file: 'dist/htmlminifier.umd.bundle.js',
      format: 'umd',
      exports: 'named',
      name: 'HTMLMinifier'
    }],
    plugins: [
      commonjs(),
      nodePolyfills(),
      nodeResolve({
        preferBuiltins: false
      }),
      json()
    ]
  },
  {
    input: 'src/index.js',
    output: [{
      file: 'dist/htmlminifier.umd.bundle.min.js',
      format: 'umd',
      exports: 'named',
      name: 'HTMLMinifier'
    }],
    plugins: [
      commonjs(),
      nodePolyfills(),
      nodeResolve({
        preferBuiltins: false
      }),
      json(),
      terser()
    ]
  },
  {
    input: 'src/index.js',
    output: {
      file: 'dist/htmlminifier.esm.bundle.js',
      format: 'es'
    },
    plugins: [
      commonjs(),
      nodePolyfills(),
      nodeResolve({
        preferBuiltins: false
      }),
      json()
    ]
  },
  {
    input: 'src/index.js',
    output: {
      file: 'dist/htmlminifier.cjs',
      format: 'cjs'
    },
    external: ['htmlparser2', 'clean-css', 'terser', 'relateurl']
  }
]);

export default config;
