import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite';

export default defineConfig(({ }) => {
    const env = loadEnv('test', process.cwd(), '');
    return {
        test: {
            globals: true,
            environment: 'node',
            env,
            coverage: {
                provider: 'v8',
            },
            include: ['**/tests/*.test.ts']
        }
    }
})