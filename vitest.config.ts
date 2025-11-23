import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    test: {
      coverage: {
        enabled: true,
        provider: 'v8',
      },
      env,
      environment: 'node',
      exclude: ['node_modules/**', 'dist/**', '**/build/**'],
      globals: true,
      include: ['**/tests/*.test.ts'],
      isolate: true,
      threads: false,
    },
  }
})
