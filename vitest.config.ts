import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/**/*.test.{ts,tsx}',
      'src/**/__tests__/**/*.test.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
    ],
    exclude: [
      'tests/**/*.spec.{ts,tsx}',  // Playwright E2E tests
      'e2e/**/*.spec.{ts,tsx}',    // Playwright E2E tests
      'node_modules',
      '.next',
      '.vercel',
      'dist',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'text-summary'],
      include: [
        'src/lib/**/*.{ts,tsx}',
        'src/core/**/*.{ts,tsx}',
        'src/infrastructure/**/*.{ts,tsx}',
        'src/features/**/*.{ts,tsx}',
        'src/database/**/*.{ts,tsx}',
        'src/domain/**/*.{ts,tsx}',
        'src/agents/**/*.{ts,tsx}',
        'src/workflows/**/*.{ts,tsx}',
        'src/middleware/**/*.{ts,tsx}',
        'src/app/api/v1/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.{ts,tsx}',
        '**/*.config.*',
        '**/types.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/app/api/v1/admin/**',  // Keep admin API excluded (test separately)
        'src/app/api/v1/system/**',  // Keep system API excluded
      ],
      threshold: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
})
