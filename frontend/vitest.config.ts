import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/App.tsx',
        'src/__tests__/**',
        'src/types/**',
        '**/*.d.ts',
      ],
      thresholds: {
        branches: 85,
        functions: 95,
        lines: 95,
        statements: 95,
      },
      reporter: ['text', 'lcov', 'json-summary'],
    },
  },
});
