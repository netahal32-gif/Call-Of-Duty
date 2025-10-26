import type { FastifyInstance } from 'fastify'
import buildServer from '../src/server.js'

describe('Health', () => {
  let server: FastifyInstance

  beforeAll(async () => {
    server = await buildServer()
  })

  afterAll(async () => {
    await server.close()
  })

  test('GET /health should return 200 "status ok" if the server is working', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })

  test('GET /health/db should return 200 "status ok" if the db is working', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health/db',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })

  test('GET /health/db should return 503 "No mongoDB connection" if there is no connection', async () => {
    await server.mongo.client.close()
    const response = await server.inject({
      method: 'GET',
      url: '/health/db',
    })

    expect(response.statusCode).toBe(503)
    expect(response.json()).toEqual({ status: 'No mongoDB connection' })
  })
})
