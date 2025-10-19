import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

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
      exclude: [],
    },
  }
})
