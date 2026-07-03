/// <reference types="vitest" />
import angular from '@analogjs/vite-plugin-angular';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// Vitest + AnalogJS Angular plugin: runs the same Angular sources the app builds,
// so ViewModels and components test under a real (jsdom) Angular environment.
// tsconfigPaths resolves the spartan helm aliases (@spartan-ng/helm/*) the same
// way the Angular build does.
export default defineConfig(() => ({
  plugins: [angular(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
  },
}));
