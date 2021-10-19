// @ts-check

import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import { terser } from 'rollup-plugin-terser';

/** @type {import("rollup").RollupOptions[] } */
const config = [
  {
    input: 'src/htmlminifier.js',
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
      })
    ]
  },
  {
    input: 'src/htmlminifier.js',
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
      terser()
    ]
  },
  {
    input: 'src/htmlminifier.js',
    output: {
      file: 'dist/htmlminifier.esm.bundle.js',
      format: 'es'
    },
    plugins: [
      commonjs(),
      nodePolyfills(),
      nodeResolve({
        preferBuiltins: false
      })
    ]
  },
  {
    input: 'src/htmlminifier.js',
    output: {
      file: 'dist/htmlminifier.js',
      format: 'es'
    },
    plugins: [
      commonjs()
    ],
    external: ['clean-css', 'terser', 'he', 'relateurl']
  }
];

export default config;
