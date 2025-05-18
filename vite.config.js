import { defineConfig } from 'vite';

const isProduction = process.env.NODE_ENV === 'production';

const config = defineConfig({
  root: 'demo', // Ensure the root is set to the demo directory
  base: isProduction ? '/html-minifier-guard/' : '/', // Use the correct base path for GitHub Pages
  build: {
    outDir: '../build', // Output directory for production build
    emptyOutDir: true
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
