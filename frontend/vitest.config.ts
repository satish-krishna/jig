/// <reference types="vitest" />
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

// Vitest + AnalogJS Angular plugin: runs the same Angular sources the app builds,
// so ViewModels and components test under a real (jsdom) Angular environment.
export default defineConfig(() => ({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
  },
}));
