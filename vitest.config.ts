import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    // No test files exist yet — Task 2 adds the first one. Vitest exits
    // non-zero on an empty suite by default, which would break `verify`
    // before there is anything to test; this keeps the gate meaningful once
    // real tests land instead of failing for a reason unrelated to them.
    passWithNoTests: true,
  },
});
