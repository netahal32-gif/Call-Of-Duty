import type { FastifyInstance } from 'fastify'
import buildServer from '../src/server.js'

describe('Health', () => {
  let server: FastifyInstance

  beforeAll(async () => {
    const baseUrl = process.env.MONGO_URL!
    const url = `${baseUrl}-health`
    process.env.MONGO_URL = url
    server = await buildServer()
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    const db = server.mongo.db
    if (db) await db.dropDatabase()
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
