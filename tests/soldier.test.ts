import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

let server: FastifyInstance

beforeAll(async () => {
  const { default: buildServer } = await import('../src/server.js')
  server = await buildServer()
})

afterAll(async () => {
  const db = server.mongo.db
  if (db) await db.dropDatabase()
  await server.close()
})

describe('Soldier', () => {
  test('POST /soldiers should create and return the new soldier', async () => {
    const soldierPostRequest = {
      id: '1234567',
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
    expect(soldier.id).toBe(soldierPostRequest.id)
    expect(soldier.name).toBe(soldierPostRequest.name)
    expect(soldier.rank.name).toBe(soldierPostRequest.rank.name)
    expect(soldier.rank.value).toBe(5)
    expect(soldier.limitations).toEqual(soldierPostRequest.limitations.map(l => l.toLowerCase()))
    expect(new Date(soldier.createdAt).toISOString()).toBeTruthy()
    expect(new Date(soldier.updatedAt).toISOString()).toBeTruthy()

  })

  test('POST /soldiers should return code 400 rank name and value must match', async () => {
    const soldierPostRequest = {
      id: '1234567',
      limitations: ['STANDING', 'sUn'],
      name: 'John Doe',
      rank: {
        name: 'major',
        value: 8
      },
    }

    const response = await server.inject({
      method: 'POST',
      payload: soldierPostRequest,
      url: '/soldiers',
    })

    expect(response.statusCode).toBe(400)

    const responseBody = JSON.parse(response.payload)

    expect(responseBody.details.rank).toEqual([
      "Value must be between 0 and 6",
      "Rank name and rank value must match",
    ])
    expect(responseBody.message).toBe('Invalid request body')
  })

  test('GET /soldiers/1234567 should return the soldier', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/soldiers/1234567',
    })

    expect(response.statusCode).toBe(200)

    const responseBody = JSON.parse(response.payload)
    const soldier = responseBody.data

    expect(responseBody.message).toBe('Soldier retrieved successfully')
    expect(soldier.id).toBe("1234567")
  })

  test('GET /soldiers/1234560 should return 404 soldier not found', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/soldiers/1234560',
    })

    expect(response.statusCode).toBe(404)

    const responseBody = JSON.parse(response.payload)

    expect(responseBody.message).toBe(`No soldier found with the id: 1234560`)
  })

  test('GET /soldiers?rank_value=5 should return all soldiers in that rank', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/soldiers?rank_value=5',
    })

    expect(response.statusCode).toBe(200)

    const responseBody = JSON.parse(response.payload)
    const soldiers = responseBody.data

    expect(responseBody.message).toBe('Soldiers retrieved successfully')
    expect(Array.isArray(soldiers)).toBe(true);
    expect(soldiers.length).toBeGreaterThan(0);

    for (const s of soldiers) {
      expect(s.rank.value).toBe(5);
    }
  })
  
  test('GET /soldiers?rank_value=8 should return "No soldiers found"', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/soldiers?rank_value=8',
    })

    expect(response.statusCode).toBe(404)

    const responseBody = JSON.parse(response.payload)
    const soldiers = responseBody.data

    expect(responseBody.message).toBe(`No soldiers found with the params: {"rank_value":8}`)
  })
})
