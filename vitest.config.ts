import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  const env = loadEnv('test', process.cwd(), '')

  return {
    test: {
      environment: 'node',
      globals: true,
      coverage: {
        provider: 'v8',
      },
      env,
      include: ['**/tests/*.test.ts'],
      exclude: ['node_modules/**',
        'dist/**',
        '**/build/**'],
    },
  }
})
