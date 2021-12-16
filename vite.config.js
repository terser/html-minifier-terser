import { defineConfig } from 'vite';

const config = defineConfig({
  root: 'demo',
  build: {
    outDir: 'build'
  },
  server: {
    port: 3456
  },
  define: {
    'process.env': {}
  }
});

export default config;
