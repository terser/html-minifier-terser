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
    'process.env': {},
    'process.platform': JSON.stringify(process.platform)
  }
});

export default config;
