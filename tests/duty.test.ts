import type { FastifyInstance } from 'fastify'
import buildServer from '../src/server.js'
import { makeDuty } from './data.js'
import { dutyPostBody } from './db-insert.js'

describe('Duty Routes', () => {
  let server: FastifyInstance

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

  describe('POST /duties', () => {
    test('POST /duties should return 201 and creates a duty if body is valid', async () => {
      const payload = dutyPostBody()
      const response = await server.inject({
        method: 'POST',
        payload,
        url: '/duties',
      })

      const duty = response.json().data
      expect(response.statusCode).toBe(201)

      expect(duty).toMatchObject({
        constraints: payload.constraints,
        description: payload.description,
        location: payload.location,
        maxRank: payload.maxRank,
        minRank: payload.minRank,
        name: payload.name,
        soldiers: [],
        soldiersRequired: payload.soldiersRequired,
        status: 'unscheduled',
        value: payload.value,
      })
      const dateFields = ['createdAt', 'updatedAt', 'startTime', 'endTime']
      for (const key of dateFields) {
        expect(new Date(duty[key]).toISOString()).toBeTruthy()
      }
      expect(duty.statusHistory[0].status).toBe('unscheduled')
      expect(new Date(duty.statusHistory[0].date).toISOString()).toBeTruthy()
    })
    test('POST /duties should return 400 if start time is in the past', async () => {
      const payload = dutyPostBody({
        startTime: new Date('1900-11-20T09:00:00.000Z'),
      })

      const response = await server.inject({
        method: 'POST',
        payload: payload,
        url: '/duties',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/startTime StartTime must be a future date')
    })

    test('POST /duties should return 400 if end time is in the past', async () => {
      const payload = dutyPostBody({
        endTime: new Date('1900-11-20T09:00:00.000Z'),
        startTime: new Date('2025-11-20T09:00:00.000Z'),
      })

      const response = await server.inject({
        method: 'POST',
        payload: payload,
        url: '/duties',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toContain('✖ body/endTime EndTime must be a future date')
    })

    test('POST /duties should return 400 if end time is before the start time', async () => {
      const payload = dutyPostBody({
        endTime: new Date('2026-11-20T09:00:00.000Z'),
        startTime: new Date('2026-11-20T09:00:00.000Z'),
      })

      const response = await server.inject({
        method: 'POST',
        payload: payload,
        url: '/duties',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/startTime startTime must be before endTime')
    })

    test('POST /duties should return 400 if the location has less then 2 items', async () => {
      const payload = dutyPostBody({
        location: [],
      })

      const response = await server.inject({
        method: 'POST',
        payload: payload,
        url: '/duties',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/location Too small: expected array to have >=2 items')
    })

    test('POST /duties should return 400 if the location has more then 3 items', async () => {
      const payload = dutyPostBody({
        location: [34.7815, 32.0856, 15, 55],
      })

      const response = await server.inject({
        method: 'POST',
        payload: payload,
        url: '/duties',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/location Too big: expected array to have <=3 items')
    })

    test('POST /duties should return 400 if rank is bigger than allowed in schema', async () => {
      const payload = dutyPostBody({
        maxRank: 7,
        minRank: 7,
      })

      const response = await server.inject({
        method: 'POST',
        payload: payload,
        url: '/duties',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe(
        '✖ body/maxRank Too big: expected number to be <=6, body/minRank Too big: expected number to be <=6',
      )
    })

    test('POST /duties should return 400 if rank is smaller than allowed in schema', async () => {
      const payload = dutyPostBody({
        maxRank: -1,
        minRank: -1,
      })

      const response = await server.inject({
        method: 'POST',
        payload: payload,
        url: '/duties',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe(
        '✖ body/maxRank Too small: expected number to be >=0, body/minRank Too small: expected number to be >=0',
      )
    })

    test('POST /duties should return 400 if minRank is bigger than maxRank', async () => {
      const payload = dutyPostBody({
        maxRank: 2,
        minRank: 5,
      })

      const response = await server.inject({
        method: 'POST',
        payload: payload,
        url: '/duties',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/minRank minRank cannot be greater than maxRank')
    })

    test('POST /duties should return 400 if the body is empty', async () => {
      const payload = {}

      const response = await server.inject({
        method: 'POST',
        payload: payload,
        url: '/duties',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/constraints Invalid input: expected array, received undefined, body/description Invalid input: expected string, received undefined, body/endTime Invalid input: expected date, received Date, body/location Invalid input: expected array, received undefined, body/name Invalid input: expected string, received undefined, body/soldiersRequired Invalid input: expected number, received NaN, body/startTime Invalid input: expected date, received Date, body/value Invalid input: expected number, received NaN',
      )
    })

    test('POST /duties should return 400 if there is an extra param', async () => {
      const payload = dutyPostBody({})
      const payloadWithExtraParam = { ...payload, extraParam: 'extra' }
      const response = await server.inject({
        method: 'POST',
        payload: payloadWithExtraParam,
        url: '/duties',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/ Unrecognized key: "extraParam"')
    })

    test('POST /duties should return 400  if the name is less then 3 characters', async () => {
      const payload = dutyPostBody({
        name: 'Jo',
      })

      const response = await server.inject({
        method: 'POST',
        payload: payload,
        url: '/duties',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/name Too small: expected string to have >=3 characters')
    })

    test('POST /duties should return 400  if the name is more then 50 characters', async () => {
      const payload = dutyPostBody({
        name: 'Johhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhn',
      })

      const response = await server.inject({
        method: 'POST',
        payload: payload,
        url: '/duties',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/name Too big: expected string to have <=50 characters')
    })
  })

  describe('GET /duties/:_id', () => {
    test('GET /duties/:_id should return 200  if a duty with that id is exists in the db', async () => {
      const id = await makeDuty(server)
      const response = await server.inject({
        method: 'GET',
        url: `/duties/${id}`,
      })
      expect(response.statusCode).toBe(200)
    })

    test('GET /duties/:id should return 404 if no duty with that id exist in the db', async () => {
      const id = '691d7ed9aa601e3c057e90bd'
      const response = await server.inject({
        method: 'GET',
        url: `/duties/${id}`,
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe(`No duty found with the id: ${id}`)
    })
  })

  describe('GET /duties', () => {
    test('GET /duties?name=Guard the Main Gate should return 200  if there are any duties in the db with that name', async () => {
      await makeDuty(server, { name: 'Guard the Main Gate' })
      const response = await server.inject({
        method: 'GET',
        url: '/duties?name=Guard the Main Gate',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(Array.isArray(duties)).toBe(true)
      expect(duties.length).toBeGreaterThan(0)

      for (const d of duties) {
        expect(d.name).toBe('Guard the Main Gate')
      }
    })

    test('GET /duties?description=Soldiers will secure the main gate during night hours. should return 200  if there are any duties in the db with that description', async () => {
      await makeDuty(server, { description: 'Soldiers will secure the main gate during night hours.' })
      const response = await server.inject({
        method: 'GET',
        url: '/duties?description=Soldiers will secure the main gate during night hours.',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(Array.isArray(duties)).toBe(true)
      expect(duties.length).toBeGreaterThan(0)

      for (const d of duties) {
        expect(d.description).toBe('Soldiers will secure the main gate during night hours.')
      }
    })

    test('GET /duties?constraints=No phones&constraints=Night duty should return 200  if there are any duties in the db with those constrains', async () => {
      await makeDuty(server, { constraints: ['No phones', 'Night duty'] })
      const response = await server.inject({
        method: 'GET',
        url: '/duties?constraints=No phones&constraints=Night duty',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(Array.isArray(duties)).toBe(true)
      expect(duties.length).toBeGreaterThan(0)

      for (const d of duties) {
        expect(d.constraints).toEqual(['No phones', 'Night duty'])
      }
    })

    test('GET /duties?value=100 should return 200  if there are any duties in the db with that value', async () => {
      await makeDuty(server, { value: 100 })
      const response = await server.inject({
        method: 'GET',
        url: '/duties?value=100',
      })

      const responseBody = response.json()
      const duties = responseBody.data
      expect(response.statusCode).toBe(200)
      expect(Array.isArray(duties)).toBe(true)
      expect(duties.length).toBeGreaterThan(0)

      for (const d of duties) {
        expect(d.value).toBe(100)
      }
    })

    test('GET /duties?startTime=2026-11-19 should return 200 if startTime >= provided', async () => {
      await makeDuty(server, {
        endTime: new Date('2027-01-01T00:00:00Z'),
        startTime: new Date('2026-12-01T00:00:00Z'),
      })

      const response = await server.inject({
        method: 'GET',
        url: '/duties?startTime=2026-11-19',
      })

      const duties = response.json().data

      expect(response.statusCode).toBe(200)
      expect(Array.isArray(duties)).toBe(true)
      expect(duties.length).toBeGreaterThan(0)

      for (const d of duties) {
        expect(new Date(d.startTime) >= new Date('2026-11-19')).toBe(true)
      }
    })

    test('GET /duties?endTime=2025-11-19 should return 200 if endTime <= provided', async () => {
      await makeDuty(server, {
        endTime: new Date('2026-09-15T00:00:00Z'),
        startTime: new Date('2026-09-01T00:00:00Z'),
      })

      const response = await server.inject({
        method: 'GET',
        url: '/duties?endTime=2026-10-01',
      })

      const duties = response.json().data

      expect(response.statusCode).toBe(200)
      expect(Array.isArray(duties)).toBe(true)
      expect(duties.length).toBeGreaterThan(0)

      for (const d of duties) {
        expect(new Date(d.endTime) <= new Date('2026-10-01T00:00:00Z')).toBe(true)
      }
    })

    test('GET /duties?createdAt=2025-11-19 should return 200  if there are any duties in the db with that created date or after', async () => {
      await makeDuty(server, { createdAt: new Date('2025-11-19T00:00:00Z') })
      const response = await server.inject({
        method: 'GET',
        url: '/duties?createdAt=2025-11-19',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(Array.isArray(duties)).toBe(true)
      expect(duties.length).toBeGreaterThan(0)

      for (const d of duties) {
        expect(new Date(d.createdAt) >= new Date('2025-11-19')).toBe(true)
      }
    })

    test('GET /duties?updatedAt=2025-11-19 should return 200  if there are any duties in the db with that updated date or after', async () => {
      await makeDuty(server, { updatedAt: new Date('2025-11-19T00:00:00Z') })
      const response = await server.inject({
        method: 'GET',
        url: '/duties?updatedAt=2025-11-19',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(Array.isArray(duties)).toBe(true)
      expect(duties.length).toBeGreaterThan(0)

      for (const d of duties) {
        expect(new Date(d.updatedAt) >= new Date('2025-11-19')).toBe(true)
      }
    })

    test('GET /duties?location=34.7812&location=32.0853 should return 200  if there are any duties in the db with that location', async () => {
      await makeDuty(server, { location: [34.7812, 32.0853] })
      const response = await server.inject({
        method: 'GET',
        url: '/duties?location=34.7812&location=32.0853',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(Array.isArray(duties)).toBe(true)
      expect(duties.length).toBeGreaterThan(0)

      for (const d of duties) {
        expect(d.location).toStrictEqual([34.7812, 32.0853])
      }
    })

    test('GET /duties?maxRank=5 should return 200  if there are any duties in the db with that maxRank', async () => {
      await makeDuty(server, { maxRank: 5 })
      const response = await server.inject({
        method: 'GET',
        url: '/duties?maxRank=5',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(Array.isArray(duties)).toBe(true)
      expect(duties.length).toBeGreaterThan(0)

      for (const d of duties) {
        expect(d.maxRank).toBe(5)
      }
    })

    test('GET /duties?minRank=5 should return 200  if there are any duties in the db with that minRank', async () => {
      await makeDuty(server, { maxRank: 5, minRank: 5 })
      const response = await server.inject({
        method: 'GET',
        url: '/duties?minRank=5',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(Array.isArray(duties)).toBe(true)
      expect(duties.length).toBeGreaterThan(0)

      for (const d of duties) {
        expect(d.minRank).toBe(5)
      }
    })

    test('GET /duties?soldiersRequired=5 should return 200  if there are any duties in the db with that amount of soldiersRequired', async () => {
      await makeDuty(server, { soldiersRequired: 5 })
      const response = await server.inject({
        method: 'GET',
        url: '/duties?soldiersRequired=5',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(Array.isArray(duties)).toBe(true)
      expect(duties.length).toBeGreaterThan(0)

      for (const d of duties) {
        expect(d.soldiersRequired).toBe(5)
      }
    })

    test('GET /duties?status="unscheduled" should return 200  if there are any duties in the db with that status', async () => {
      await makeDuty(server, { status: 'unscheduled' })
      const response = await server.inject({
        method: 'GET',
        url: '/duties?status=unscheduled',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(Array.isArray(duties)).toBe(true)
      expect(duties.length).toBeGreaterThan(0)

      for (const d of duties) {
        expect(d.status).toBe('unscheduled')
      }
    })

    test('GET /duties?soldiers=1234567&soldiers=1234568 should return 200  if there are any duties in the db with those soldiers', async () => {
      await makeDuty(server, { soldiers: ['1234567', '1234568'] })
      const response = await server.inject({
        method: 'GET',
        url: '/duties?soldiers=1234567&soldiers=1234568',
      })

      const responseBody = response.json()
      const duties = responseBody.data
      expect(response.statusCode).toBe(200)
      expect(Array.isArray(duties)).toBe(true)
      expect(duties.length).toBeGreaterThan(0)

      for (const d of duties) {
        expect(d.soldiers).toEqual(expect.arrayContaining(['1234567', '1234568']))
      }
    })

    test('GET /duties?status="none" should return 404  if there aren`t any duties in the db with those params', async () => {
      await makeDuty(server, { status: 'unscheduled' })
      const response = await server.inject({
        method: 'GET',
        url: '/duties?status=none',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe(`No duties found with the params: {"status":"none"}`)
    })

    test('GET /duties?minRank=8 should return 400 and if the minRank is bigger then allowed in the schema', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/duties?minRank=8',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe(`✖ querystring/minRank Too big: expected number to be <=6`)
    })
  })

  describe('DELETE /duties/:_id', () => {
    test('DELETE /duties/:_id should delete the duty and return 204 if the duty was deleted successfully', async () => {
      const id = await makeDuty(server)
      const response = await server.inject({
        method: 'DELETE',
        url: `/duties/${id}`,
      })

      const afterResponse = await server.inject({
        method: 'GET',
        url: `/duties/${id}`,
      })

      expect(response.statusCode).toBe(204)
      expect(afterResponse.statusCode).toBe(404)
    })

    test('DELETE /duties/:_id should return 404 if there is no duty with that id in the db', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/duties/691d7ed9aa601e3c057e90bd',
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('PATCH /duties/:_id', () => {
    test('PATCH /duties/:_id should return 200 if  a duty with that id exists and the body request matches the schema', async () => {
      const id = await makeDuty(server)
      const beforeResponse = await server.inject({
        method: 'GET',
        url: `/duties/${id}`,
      })

      const beforeDuty  = beforeResponse.json().data
      const beforeHistory = beforeDuty.statusHistory

      const dutyPatchBody = {
        description: 'Routine check and repair of military equipment in the armory.',
        name: 'Equipment Maintenance',
        status: "status"
      }

      const response = await server.inject({
        method: 'PATCH',
        payload: dutyPatchBody,
        url: `/duties/${id}`,
      })
      const duty = response.json().data
      const afterHistory = duty.statusHistory

      expect(beforeResponse.statusCode).toBe(200)
      expect(response.statusCode).toBe(200)
      expect(duty).toMatchObject({
        description: dutyPatchBody.description,
        name: dutyPatchBody.name,
      })
      expect(new Date(duty.createdAt).toISOString()).toBe(new Date(beforeDuty .createdAt).toISOString())
      expect(new Date(duty.updatedAt).getTime()).toBeGreaterThan(new Date(beforeDuty.updatedAt).getTime())
      expect(afterHistory.length).toBe(beforeHistory.length + 1)

      const lastEntry = afterHistory[afterHistory.length - 1]

      expect(lastEntry.status).toBe(dutyPatchBody.status)

      const prevEntry = beforeHistory[beforeHistory.length - 1]
      expect(new Date(lastEntry.date).getTime()).toBeGreaterThan(new Date(prevEntry.date).getTime())
    })

    test('PATCH /duties/:_id should return 400  if the request`s body contains unrecognized keys', async () => {
      const id = await makeDuty(server)
      const dutyPatchBody = {
        id: '1234567',
      }

      const response = await server.inject({
        method: 'PATCH',
        payload: dutyPatchBody,
        url: `/duties/${id}`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/ Unrecognized key: "id"')
    })

    test('PATCH /duties/:_id should return 404  if there isn`t a duty with that id', async () => {
      const id = '691d7ed9aa601e3c057e90bd'
      const dutyPatchBody = {
        name: 'Name',
      }

      const response = await server.inject({
        method: 'PATCH',
        payload: dutyPatchBody,
        url: `/duties/${id}`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe('No duty found with id 691d7ed9aa601e3c057e90bd')
    })

    test('PATCH /duties/:_id should return 404  if there isn`t any fileds', async () => {
      const id = '691d7ed9aa601e3c057e90bd'
      const dutyPatchBody = {}

      const response = await server.inject({
        method: 'PATCH',
        payload: dutyPatchBody,
        url: `/duties/${id}`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/ At least one field must be provided to update')
    })

    test('PATCH /duties/:_id should return 409  if the duty is already scheduled', async () => {
      const id = await makeDuty(server, { status: 'scheduled' })
      const dutyPatchBody = { name: 'Name' }

      const response = await server.inject({
        method: 'PATCH',
        payload: dutyPatchBody,
        url: `/duties/${id}`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(409)
      expect(responseBody.message).toBe('Cannot modify scheduled duties')
    })
  })

  describe('PUT /duties/:_id/constraints', () => {
    test('PUT /duties/:_id/constraints should return 200  if a duty with that id exists and the request body fits the schema', async () => {
      const id = await makeDuty(server)
      const beforeResponse = await server.inject({
        method: 'GET',
        url: `/duties/${id}`,
      })

      const beforeDuty = beforeResponse.json().data
      const oldConstraints = beforeDuty.constraints || []
      const oldUpdateDate = new Date(beforeDuty.updatedAt)

      const dutyPutBody = ['Wear protective gloves', 'Follow safety protocol']

      const response = await server.inject({
        method: 'PUT',
        payload: dutyPutBody,
        url: `/duties/${id}/constraints`,
      })
      const responseBody = response.json()
      const duty = responseBody.data
      const expectedConstraints = [...oldConstraints, ...dutyPutBody]
      expect(beforeResponse.statusCode).toBe(200)
      expect(response.statusCode).toBe(200)
      expect(duty.constraints).toEqual(expectedConstraints)
      expect(new Date(duty.updatedAt).getTime()).toBeGreaterThan(oldUpdateDate.getTime())
    })

    test('PUT /duties/:_id/constraints should return 400  if the request body is empty', async () => {
      const id = await makeDuty(server)
      const dutyPutBody: string[] = []

      const response = await server.inject({
        method: 'PUT',
        payload: dutyPutBody,
        url: `/duties/${id}/constraints`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/ At least one constrain must be provided to update')
    })

    test('PUT /duties/:_id/constraints should return 404  if there is no duty with that id', async () => {
      const id = '691d7ed9aa601e3c057e90bd'
      const dutyPutBody = ['Limit']

      const response = await server.inject({
        method: 'PUT',
        payload: dutyPutBody,
        url: `/duties/${id}/constraints`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe('No duty found with the id: 691d7ed9aa601e3c057e90bd')
    })

    test('PUT /duties/:_id/constraints should return 409  if the duty is already scheduled', async () => {
      const id = await makeDuty(server, { status: 'scheduled' })
      const dutyPatchBody = ['Limit']

      const response = await server.inject({
        method: 'PUT',
        payload: dutyPatchBody,
        url: `/duties/${id}/constraints`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(409)
      expect(responseBody.message).toBe('Cannot change scheduled duties')
    })
  })
})