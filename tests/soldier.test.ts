import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

let server: FastifyInstance

beforeAll(async () => {
  const { default: buildServer } = await import('../src/server.js')
  server = await buildServer()
  await server.mongo.db?.collection('soldiers').insertMany([
    {
      "id": "1000001",
      "name": "John Doe",
      "rank": { "name": "major", "value": 5 },
      "limitations": ["sunlight", "running"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      "id": "1000002",
      "name": "Alice Carter",
      "rank": { "name": "major", "value": 5 },
      "limitations": ["cold", "long standing"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      "id": "1000003",
      "name": "Michael Tan",
      "rank": { "name": "sergeant", "value": 2 },
      "limitations": ["heavy lifting"],
      createdAt: new Date(),
      updatedAt: new Date(),
    }])
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

    expect(responseBody.details).toEqual([
      { path: "rank.value", message: "Value must be between 0 and 6" },
    ])

    expect(responseBody.message).toBe('Invalid request body')
  })

  test('GET /soldiers/1000001 should return the soldier', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/soldiers/1000001',
    })

    expect(response.statusCode).toBe(200)

    const responseBody = JSON.parse(response.payload)
    const soldier = responseBody.data

    expect(responseBody.message).toBe('Soldier retrieved successfully')
    expect(soldier.id).toBe("1000001")
  })

  test('GET /soldiers/1000099 should return 404 soldier not found', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/soldiers/1000099',
    })

    expect(response.statusCode).toBe(404)

    const responseBody = JSON.parse(response.payload)

    expect(responseBody.message).toBe(`No soldier found with the id: 1000099`)
  })

  test('GET /soldiers?rank_value=5 should return all soldiers in that rank', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/soldiers?rank_value=5',
    })

    if (response.statusCode !== 200) {
      console.error('Response error:', response.payload, 1111111111111111111111)
    }

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

    expect(responseBody.message).toBe(`No soldiers found with the params: {"rank_value":8}`)
  })

  test('DELETE /soldiers/1000003 should delete the soldier', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: '/soldiers/1000003',
    })

    expect(response.statusCode).toBe(204)
    expect(response.payload).toBe("")
  })

  test('DELETE /soldiers/1000006 should return 404 "No soldier found"', async () => {
    const response = await server.inject({
      method: 'DELETE',
      url: '/soldiers/1000006',
    })

    expect(response.statusCode).toBe(404)
  })

  test('PATCH /soldiers/1000002 should return an updated soldier', async () => {
    const beforeResponse = await server.inject({
      method: 'GET',
      url: '/soldiers/1000002',
    })
    expect(beforeResponse.statusCode).toBe(200)

    const beforeBody = JSON.parse(beforeResponse.payload)
    const beforeSoldier = beforeBody.data
    const oldUpdatedAt = new Date(beforeSoldier.updatedAt)

    const soldierPatchRequest = {
      name: 'Peggy Carter',
      rank: {
        value: 0
      },
    }


    const response = await server.inject({
      method: 'PATCH',
      payload: soldierPatchRequest,
      url: '/soldiers/1000002',
    })
    expect(response.statusCode).toBe(200)

    const responseBody = JSON.parse(response.payload)
    const soldier = responseBody.data

    expect(responseBody.message).toBe('Soldier patched successfully')
    expect(soldier.id).toBe("1000002")
    expect(soldier.name).toBe(soldierPatchRequest.name)
    expect(soldier.rank.name).toBe("private")
    expect(soldier.rank.value).toBe(soldierPatchRequest.rank.value)
    expect(new Date(soldier.createdAt).toISOString()).toBe(beforeSoldier.createdAt)
    expect((new Date(soldier.updatedAt)).getTime()).toBeGreaterThan(oldUpdatedAt.getTime())
  })

  test('PATCH /soldiers/1000002 should fail patching the id', async () => {
    const soldierPatchRequest = {
      id: "1234567"
    }

    const response = await server.inject({
      method: 'PATCH',
      payload: soldierPatchRequest,
      url: '/soldiers/1000002',
    })
    expect(response.statusCode).toBe(400)

    const responseBody = JSON.parse(response.payload)
    const responseBodyDetails = responseBody.details[0]

    expect(responseBody.message).toBe('Invalid request body')
    expect(responseBodyDetails.message).toBe("Unrecognized key: \"id\"")
  })
})
