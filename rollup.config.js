import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

const bunldePlugins = [
  commonjs(),
  nodePolyfills(),
  nodeResolve({
    preferBuiltins: false
  }),
  json()
];

const config = defineConfig([
  {
    input: 'src/htmlminifier.js',
    output: [{
      file: 'dist/htmlminifier.umd.bundle.js',
      format: 'umd',
      exports: 'named',
      name: 'HTMLMinifier'
    }],
    plugins: bunldePlugins
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
      ...bunldePlugins,
      terser()
    ]
  },
  {
    input: 'src/htmlminifier.js',
    output: {
      file: 'dist/htmlminifier.esm.bundle.js',
      format: 'es'
    },
    plugins: bunldePlugins
  },
  {
    input: 'src/htmlminifier.js',
    output: {
      file: 'dist/htmlminifier.cjs',
      format: 'cjs'
    },
    external: ['clean-css', 'terser', 'entities', 'relateurl']
  }
]);

export default config;
