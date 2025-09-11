import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import nodePolyfills from 'rollup-plugin-polyfill-node';

// Suppress known harmless warnings from terser and polyfill dependencies
const onwarn = (warning, warn) => {
  // console.log('Warning code:', warning.code, 'Message:', warning.message.substring(0, 50));

  // Ignore terser comment parsing warnings
  if (warning.message && warning.message.includes('#__PURE__ comments')) {
    return;
  }
  // Ignore circular dependency warnings from node polyfills and terser internals
  if (warning.code === 'CIRCULAR_DEPENDENCY' &&
      (warning.message.includes('polyfill-node') ||
       warning.message.includes('node_modules/terser'))) {
    return;
  }
  // Show all other warnings
  warn(warning);
};

const bundlePlugins = [
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
    plugins: bundlePlugins,
    onwarn
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
      ...bundlePlugins,
      terser()
    ],
    onwarn
  },
  {
    input: 'src/htmlminifier.js',
    output: {
      file: 'dist/htmlminifier.esm.bundle.js',
      format: 'es'
    },
    plugins: bundlePlugins,
    onwarn
  },
  {
    input: 'src/htmlminifier.js',
    output: {
      file: 'dist/htmlminifier.cjs',
      format: 'cjs',
      exports: 'named'
    },
    external: ['clean-css', 'terser', 'entities', 'relateurl'],
    onwarn
  }
]);

export default config;