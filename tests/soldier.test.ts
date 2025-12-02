import type { FastifyInstance } from 'fastify'
import buildServer from '../src/server.js'
import type { Soldier } from '../src/types/soldier.js'
import { makeSoldier } from './data.js'
import { soldierPostBody } from './db-insert.js'

describe('Soldier Routes', () => {
  let server: FastifyInstance
  const pastDate = '2001-01-01'

  beforeAll(async () => {
    server = await buildServer()
  })

  afterAll(async () => {
    const db = server.mongo.db
    if (db) await db.dropDatabase()
    await server.close()
  })

  afterEach(async () => {
    const db = server.mongo.db
    if (db) await db.dropDatabase()
  })

  describe('POST /soldiers', () => {
    test('POST /soldiers should return 201  if the body fits the schema', async () => {
      const payload = soldierPostBody()

      const response = await server.inject({
        method: 'POST',
        payload,
        url: '/soldiers',
      })
      const soldier = response.json().data

      expect(response.statusCode).toBe(201)
      expect(soldier).toMatchObject({
        ...payload,
        limitations: payload.limitations.map(l => l.toLowerCase()),
        rank: {
          value: 5,
        },
      })
      expect(new Date(soldier.createdAt).toISOString()).toBeTruthy()
      expect(new Date(soldier.updatedAt).toISOString()).toBeTruthy()
    })

    test('POST /soldiers should return 400 if rank.value is bigger then allowed in the schema', async () => {
      const payload = soldierPostBody({
        rank: { value: 8 },
      })

      const response = await server.inject({
        method: 'POST',
        payload,
        url: '/soldiers',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/rank/value Too big: expected number to be <=6')
    })

    test('POST /soldiers should return 400  if the rank params dont match', async () => {
      const payload = soldierPostBody({
        rank: {
          name: 'private',
          value: 4,
        },
      })

      const response = await server.inject({
        method: 'POST',
        payload,
        url: '/soldiers',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/rank Rank name and rank value must match')
    })

    test('POST /soldiers should return 400  if there is neither rank.name or rank.value', async () => {
      const payload = soldierPostBody({
        rank: {},
      })

      const response = await server.inject({
        method: 'POST',
        payload,
        url: '/soldiers',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/rank Either rank.name or rank.value is required')
    })

    test('POST /soldiers should return 400  if the body is empty', async () => {
      const payload = {}

      const response = await server.inject({
        method: 'POST',
        payload,
        url: '/soldiers',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe(
        '✖ body/_id Invalid input: expected string, received undefined, body/limitations Invalid input: expected array, received undefined, body/name Invalid input: expected string, received undefined, body/rank Invalid input: expected object, received undefined',
      )
    })

    test('POST /soldiers should return 400 if the id is different then the id schema', async () => {
      const payload = soldierPostBody({
        _id: `12345678`,
      })

      const response = await server.inject({
        method: 'POST',
        payload,
        url: '/soldiers',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/_id Must be a 7-digit number string.')
    })

    test('POST /soldiers should return 400  if the name is less then 3 characters', async () => {
      const payload = soldierPostBody({
        name: 'Jo',
      })

      const response = await server.inject({
        method: 'POST',
        payload,
        url: '/soldiers',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/name Too small: expected string to have >=3 characters')
    })

    test('POST /soldiers should return 400  if the name is more then 50 characters', async () => {
      const payload = soldierPostBody({
        name: 'Johhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhn',
      })

      const response = await server.inject({
        method: 'POST',
        payload,
        url: '/soldiers',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/name Too big: expected string to have <=50 characters')
    })

    test('POST /soldiers should return 400  if there is an extra param that isn`t in the schema', async () => {
      const payload = soldierPostBody()
      const payloadWithExtraParam = { ...payload, extraParam: 'extra' }

      const response = await server.inject({
        method: 'POST',
        payload: payloadWithExtraParam,
        url: '/soldiers',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/ Unrecognized key: "extraParam"')
    })

    test('POST /soldiers should return 500  if there is already a soldier with that id', async () => {
      const _id = (await makeSoldier(server))._id
      const payload = soldierPostBody({
        _id: _id,
      })

      const response = await server.inject({
        method: 'POST',
        payload,
        url: '/soldiers',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(500)
      expect(responseBody.message).toEqual(
        `✖ E11000 duplicate key error collection: call-of-duty-test.soldiers index: _id_ dup key: { _id: "${_id}" }`,
      )
    })
  })

  describe('GET /soldiers/:_id', () => {
    test('GET /soldiers/:_id should return 200  if a soldier with that id is exists in the db', async () => {
      const id = (await makeSoldier(server))._id
      const response = await server.inject({
        method: 'GET',
        url: `/soldiers/${id}`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(200)
      expect(responseBody.data._id).toBe(id)
    })

    test('GET /soldiers/:id should return 404 if no soldier with that id exist in the db', async () => {
      const id = '0000000'
      const response = await server.inject({
        method: 'GET',
        url: `/soldiers/${id}`,
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe(`No soldier found with id ${id}`)
    })
  })

  describe('GET /soldiers', () => {
    test('GET /soldiers?rankValue=5 should return 200  if there are any soldiers in the db that are at rankValue 5', async () => {
      await makeSoldier(server, { rank: { value: 5 } })
      const response = await server.inject({
        method: 'GET',
        url: '/soldiers?rankValue=5',
      })

      const responseBody = response.json()
      const soldiers = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(soldiers.length).toBeGreaterThan(0)
      expect(soldiers.every((s: { rank: { value: number } }) => s.rank.value === 5)).toBeTruthy()
    })

    test('GET /soldiers?name=John%20Doe should return 200  if there are any soldiers in the db that are named John Doe', async () => {
      await makeSoldier(server, { name: 'John Doe' })
      const response = await server.inject({
        method: 'GET',
        url: '/soldiers?name=John%20Doe',
      })

      const responseBody = response.json()
      const soldiers = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(soldiers.length).toBeGreaterThan(0)
      expect(soldiers.every((s: { name: string }) => s.name === 'John Doe')).toBeTruthy()
    })

    test('GET /soldiers?rankName=major should return 200  if there are any soldiers in the db that are at rank major', async () => {
      await makeSoldier(server, { rank: { name: 'major' } })
      const response = await server.inject({
        method: 'GET',
        url: '/soldiers?rankName=major',
      })

      const responseBody = response.json()
      const soldiers = responseBody.data
      expect(response.statusCode).toBe(200)
      expect(soldiers.length).toBeGreaterThan(0)
      expect(soldiers.every((s: { rank: { name: string } }) => s.rank.name === 'major')).toBeTruthy()
    })

    test('GET /soldiers?limitations=sunlight&limitations=running should return 200  if there are any soldiers in the db that have sunlight and running as their limitations', async () => {
      await makeSoldier(server, { limitations: ['sunlight', 'running'] })
      const response = await server.inject({
        method: 'GET',
        url: '/soldiers?limitations=sunlight&limitations=running',
      })

      const responseBody = response.json()
      const soldiers = responseBody.data as Soldier[]

      expect(response.statusCode).toBe(200)
      expect(soldiers.length).toBeGreaterThan(0)
      expect(soldiers.every(s => s.limitations.every(l => ['sunlight', 'running'].includes(l)))).toBeTruthy()
    })

    test(`GET /soldiers?createdAt=${pastDate} should return 200 if there are any soldiers in the db that were created after the date`, async () => {
      await makeSoldier(server)
      await makeSoldier(server, { _id: '1234567', createdAt: new Date('2000-10-10T00:00:00Z') })
      const response = await server.inject({
        method: 'GET',
        url: `/soldiers?createdAt=${pastDate}`,
      })

      const responseBody = response.json()
      const soldiers = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(soldiers.length).toBeGreaterThan(0)
      expect(
        soldiers.every((s: { createdAt: Date }) => new Date(s.createdAt).getTime() > new Date(pastDate).getTime()),
      ).toBeTruthy()
    })

    test(`GET /soldiers?updatedAt=${pastDate} should return 200 if there are any soldiers in the db that were updated after the date`, async () => {
      await makeSoldier(server)
      await makeSoldier(server, {
        _id: '1234567',
        createdAt: new Date('2000-10-10T00:00:00Z'),
        updatedAt: new Date('2000-10-10T00:00:00Z'),
      })
      const response = await server.inject({
        method: 'GET',
        url: `/soldiers?updatedAt=${pastDate}`,
      })

      const responseBody = response.json()
      const soldiers = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(soldiers.length).toBeGreaterThan(0)
      expect(
        soldiers.every((s: { updatedAt: Date }) => new Date(s.updatedAt).getTime() > new Date(pastDate).getTime()),
      ).toBeTruthy()
    })

    test('GET /soldiers?rankValue=8 should return 400 and if the rankValue is bigger then allowed in the schema', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/soldiers?rankValue=8',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe(`✖ querystring/rankValue Too big: expected number to be <=6`)
    })

    test('GET /soldiers?rankValue=6 should return 404 and if there are no soldiers that fit the params ', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/soldiers?rankValue=6',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe(`No soldiers found with the params: {"rankValue":6}`)
    })
  })

  describe('DELETE /soldiers/:_id', () => {
    test('DELETE /soldiers/:_id should delete the soldier and return 204 if the soldier was deleted successfully', async () => {
      const id = (await makeSoldier(server))._id
      const response = await server.inject({
        method: 'DELETE',
        url: `/soldiers/${id}`,
      })

      const afterResponse = await server.inject({
        method: 'GET',
        url: `/soldiers/${id}`,
      })

      expect(response.statusCode).toBe(204)
      expect(afterResponse.statusCode).toBe(404)
    })

    test('DELETE /soldiers/:_id should return 404 if there is no solider with that id in the db', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/soldiers/9999999',
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('PATCH /soldiers/:_id', () => {
    test('PATCH /soldiers/:_id should return 200 if  a soldier with that id exists and the body request matches the schema', async () => {
      const beforeSoldier = await makeSoldier(server)

      const soldierPatchBody = {
        name: 'Peggy Carter',
        rank: {
          value: 0,
        },
      }

      const response = await server.inject({
        method: 'PATCH',
        payload: soldierPatchBody,
        url: `/soldiers/${beforeSoldier._id}`,
      })
      const soldier = response.json().data

      expect(response.statusCode).toBe(200)
      expect(soldier).toMatchObject({
        _id: beforeSoldier._id,
        name: soldierPatchBody.name,
        rank: {
          name: 'private',
          value: soldierPatchBody.rank.value,
        },
      })
      expect(new Date(soldier.createdAt).toISOString()).toBe(new Date(beforeSoldier.createdAt).toISOString())
      expect(new Date(soldier.updatedAt).getTime()).toBeGreaterThan(new Date(beforeSoldier.updatedAt).getTime())
    })

    test('PATCH /soldiers/:_id should return 400  if the request`s body contains unrecognized keys', async () => {
      const id = (await makeSoldier(server))._id
      const soldierPatchBody = {
        id: '1234567',
      }

      const response = await server.inject({
        method: 'PATCH',
        payload: soldierPatchBody,
        url: `/soldiers/${id}`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/ Unrecognized key: "id"')
    })

    test('PATCH /soldiers/:_id should return 404  if there isn`t a soldier with that id', async () => {
      const id = '0000000'
      const soldierPatchBody = {
        name: 'Name',
      }

      const response = await server.inject({
        method: 'PATCH',
        payload: soldierPatchBody,
        url: `/soldiers/${id}`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe('No soldier found with id 0000000')
    })

    test('PATCH /soldiers/:_id should return 404  if there isn`t any fileds', async () => {
      const id = '0000000'
      const soldierPatchBody = {}

      const response = await server.inject({
        method: 'PATCH',
        payload: soldierPatchBody,
        url: `/soldiers/${id}`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/ At least one field must be provided to update')
    })
  })

  describe('PUT /soldiers/:_id/limitations', () => {
    test('PUT /soldiers/:_id/limitations should return 200  if a soldier with that id exists and the request body fits the schema', async () => {
      const beforeSoldier = await makeSoldier(server)

      const oldLimitations = beforeSoldier.limitations || []
      const oldUpdateDate = new Date(beforeSoldier.updatedAt)

      const soldierPutBody = ['STANDING', 'sUn']

      const response = await server.inject({
        method: 'PUT',
        payload: soldierPutBody,
        url: `/soldiers/${beforeSoldier._id}/limitations`,
      })
      const responseBody = response.json()
      const soldier = responseBody.data
      const expectedLimitations = [...oldLimitations, ...soldierPutBody.map(l => l.toLowerCase())]

      expect(response.statusCode).toBe(200)
      expect(soldier.limitations).toEqual(expectedLimitations)
      expect(new Date(soldier.updatedAt).getTime()).toBeGreaterThan(oldUpdateDate.getTime())
    })

    test('PUT /soldiers/:_id/limitations should return 400  if the request body is empty', async () => {
      const id = (await makeSoldier(server))._id
      const soldierPutBody: string[] = []

      const response = await server.inject({
        method: 'PUT',
        payload: soldierPutBody,
        url: `/soldiers/${id}/limitations`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/ At least one limitation must be provided to update')
    })

    test('PUT /soldiers/:_id/limitations should return 404  if there is no soldier with that id', async () => {
      const id = '0000000'
      const soldierPutBody = ['Limit']

      const response = await server.inject({
        method: 'PUT',
        payload: soldierPutBody,
        url: `/soldiers/${id}/limitations`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe('No soldier found with the id: 0000000')
    })
  })
})
