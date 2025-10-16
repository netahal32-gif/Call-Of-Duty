import type { FastifyInstance } from 'fastify'
import { loadEnv } from 'vite'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

Object.assign(process.env, loadEnv('test', process.cwd(), ''))

let server: FastifyInstance

beforeAll(async () => {
  const { default: buildServer } = await import('../server.js')
  server = await buildServer()
})

afterAll(async () => {
  await server.close()
})

describe('Health', () => {
  test('GET /health should return status OK', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ Server_Status: 'ok' })
  })

  test('GET /health/db should return status OK', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health/db',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ DB_Status: 'ok' })
  })
})
