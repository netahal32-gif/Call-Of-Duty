import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

let server: FastifyInstance
console.log("TEST ENV:", process.env.MONGO_URL);////delete check

beforeAll(async () => {
  const { default: buildServer } = await import('../src/server.js')
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
    expect(response.json()).toEqual({ status: 'ok' })
  })

  test('GET /health/db should return status OK', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health/db',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})
