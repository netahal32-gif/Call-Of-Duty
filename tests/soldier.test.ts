import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'

let server: FastifyInstance

beforeAll(async () => {
  const { default: buildServer } = await import('../src/server.js')
  server = await buildServer()
})

afterEach(async () => {
  const db = server.mongo.db
  if (db) await db.dropDatabase()
})

afterAll(async () => {
  await server.close()
})

describe('Soldier', () => {
  test('POST /soldiers should create and return the new soldier', async () => {
    const soldierPostRequest = {
      _id: '1234567',
      limitations: ['STANDING', 'THE sUn'],
      name: 'John Doe',
      rank: {
        name: 'major',
      },
    }

    const response = await server.inject({
      method: 'POST',
      payload: soldierPostRequest,
      url: '/soldiers',
    })

    expect(response.statusCode).toBe(201)

    const responseBody = JSON.parse(response.payload)
    const soldier = responseBody.data

    expect(responseBody.message).toBe('Soldier added successfully')
    expect(soldier._id).toBe(soldierPostRequest._id)
    expect(soldier.name).toBe(soldierPostRequest.name)
    expect(soldier.rank.name).toBe(soldierPostRequest.rank.name)
    expect(soldier.rank.value).toBe(5)
    expect(soldier.limitations).toEqual(soldierPostRequest.limitations.map(l => l.toLowerCase()))
    expect(new Date(soldier.createdAt)).toBeInstanceOf(Date)
    expect(new Date(soldier.updatedAt)).toBeInstanceOf(Date)
  })
})
