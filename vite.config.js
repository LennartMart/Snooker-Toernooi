import { defineConfig } from 'vite';

export default defineConfig({
  // Base path for GitHub Pages - uses repo name
  base: '/Snooker-Toernooi/',
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});
