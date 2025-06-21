import js from '@eslint/js';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'benchmarks/**',
      'demo/build/**'
    ]
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        document: 'readonly',
        window: 'readonly'
      }
    },
    rules: {
      // Minimal rules to match existing code style
      'no-unused-vars': 'error',
      'no-undef': 'error'
    }
  }
];