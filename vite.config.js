const { defineConfig } = require('vite');

const config = defineConfig({
  root: 'demo',
  build: {
    outDir: 'build'
  },
  server: {
    port: 3456
  }
});

export default config;
