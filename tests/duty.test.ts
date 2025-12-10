import type { FastifyInstance } from 'fastify'
import buildServer from '../src/server.js'
import { createDutyService } from '../src/services/duty-service.js'
import type { Duty, DutyDB } from '../src/types/duty.js'
import { dutyDb, dutyPostBody } from './data.js'

describe('Duty Routes', () => {
  let server: FastifyInstance
  let dutyService: ReturnType<typeof createDutyService>
  const location = [34.7812, 32.0853]
  const soldierIds = ['1234567', '1234568']

  beforeAll(async () => {
    const baseUrl = process.env.MONGO_URL!
    const url = `${baseUrl}-duty`
    process.env.MONGO_URL = url
    server = await buildServer()
    dutyService = createDutyService(server)
  })

  afterAll(async () => {
    const db = server.mongo.db
    if (db) await db.dropDatabase()
    await server.close()
  })

  beforeEach(async () => {
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
        ...payload,
        endTime: payload.endTime.toISOString(),
        soldiers: [],
        startTime: payload.startTime.toISOString(),
        status: 'unscheduled',
      })
      const dateFields = ['createdAt', 'updatedAt']
      expect(dateFields.every(key => duty[key])).toBeDefined()
      expect(duty.statusHistory[0].status).toBe('unscheduled')
      expect(duty.statusHistory[0].date).toBeDefined()
    })

    test('POST /duties should return 400 if start time is in the past', async () => {
      const payload = dutyPostBody({
        startTime: new Date('1900-11-20T09:00:00.000Z'),
      })

      const response = await server.inject({
        method: 'POST',
        payload,
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
        payload,
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
        payload,
        url: '/duties',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/ startTime must be before endTime')
    })

    test('POST /duties should return 400 if the location has less then 2 items', async () => {
      const payload = dutyPostBody({
        location: [],
      })

      const response = await server.inject({
        method: 'POST',
        payload,
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
        payload,
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
        payload,
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
        payload,
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
        payload,
        url: '/duties',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/ minRank cannot be greater than maxRank')
    })

    test('POST /duties should return 400 if the body is empty', async () => {
      const payload = {}

      const response = await server.inject({
        method: 'POST',
        payload,
        url: '/duties',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe(
        '✖ body/constraints Invalid input: expected array, received undefined, body/description Invalid input: expected string, received undefined, body/endTime Invalid input: expected date, received Date, body/location Invalid input: expected array, received undefined, body/name Invalid input: expected string, received undefined, body/soldiersRequired Invalid input: expected number, received NaN, body/startTime Invalid input: expected date, received Date, body/value Invalid input: expected number, received NaN',
      )
    })

    test('POST /duties should return 400 if there is an extra param', async () => {
      const dutyBody = dutyPostBody({})
      const payload = { ...dutyBody, extraParam: 'extra' }
      const response = await server.inject({
        method: 'POST',
        payload,
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
        payload,
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
        payload,
        url: '/duties',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/name Too big: expected string to have <=50 characters')
    })
  })

  describe('GET /duties/:_id', () => {
    test('GET /duties/:_id should return 200  if a duty with that id is exists in the db', async () => {
      const id = (await dutyService.insertDuty(dutyDb()))._id
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
      await dutyService.insertDuty(dutyDb({ name: 'Guard the Main Gate' }))
      const response = await server.inject({
        method: 'GET',
        url: '/duties?name=Guard the Main Gate',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(duties.length).toBeGreaterThan(0)

      expect(duties.every((d: { name: Duty['name'] }) => d.name === 'Guard the Main Gate')).toBeTruthy()
    })

    test('GET /duties?description=Soldiers will secure the main gate during night hours. should return 200  if there are any duties in the db with that description', async () => {
      await dutyService.insertDuty(dutyDb({ description: 'Soldiers will secure the main gate during night hours.' }))
      const response = await server.inject({
        method: 'GET',
        url: '/duties?description=Soldiers will secure the main gate during night hours.',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(duties.length).toBeGreaterThan(0)

      expect(
        duties.every(
          (d: { description: Duty['description'] }) =>
            d.description === 'Soldiers will secure the main gate during night hours.',
        ),
      ).toBeTruthy()
    })

    test('GET /duties?constraints=No phones&constraints=Night duty should return 200  if there are any duties in the db with those constrains', async () => {
      await dutyService.insertDuty(dutyDb({ constraints: ['No phones', 'Night duty'] }))
      const response = await server.inject({
        method: 'GET',
        url: '/duties?constraints=No phones&constraints=Night duty',
      })

      const responseBody = response.json()
      const duties = responseBody.data as Duty[]

      expect(response.statusCode).toBe(200)
      expect(duties.length).toBeGreaterThan(0)

      expect(duties.every(d => d.constraints.every(c => ['No phones', 'Night duty'].includes(c)))).toBeTruthy()
    })

    test('GET /duties?value=100 should return 200  if there are any duties in the db with that value', async () => {
      await dutyService.insertDuty(dutyDb({ value: 100 }))
      const response = await server.inject({
        method: 'GET',
        url: '/duties?value=100',
      })

      const responseBody = response.json()
      const duties = responseBody.data
      expect(response.statusCode).toBe(200)
      expect(duties.length).toBeGreaterThan(0)

      expect(duties.every((d: { value: Duty['value'] }) => d.value === 100)).toBeTruthy()
    })

    test('GET /duties?startTime=2026-11-19 should return 200 if startTime >= provided', async () => {
      await dutyService.insertDuty(
        dutyDb({
          endTime: new Date('2027-01-01T00:00:00Z'),
          startTime: new Date('2026-12-01T00:00:00Z'),
        }),
      )

      const response = await server.inject({
        method: 'GET',
        url: '/duties?startTime=2026-11-19',
      })

      const duties = response.json().data

      expect(response.statusCode).toBe(200)
      expect(duties.length).toBeGreaterThan(0)

      expect(
        duties.every(
          (d: { startTime: Duty['startTime'] }) => new Date(d.startTime).getTime() >= new Date('2026-11-19').getTime(),
        ),
      ).toBeTruthy()
    })

    test('GET /duties?endTime=2025-11-19 should return 200 if endTime <= provided', async () => {
      await dutyService.insertDuty(
        dutyDb({
          endTime: new Date('2026-09-15T00:00:00Z'),
          startTime: new Date('2026-09-01T00:00:00Z'),
        }),
      )

      const response = await server.inject({
        method: 'GET',
        url: '/duties?endTime=2026-10-01',
      })

      const duties = response.json().data

      expect(response.statusCode).toBe(200)
      expect(duties.length).toBeGreaterThan(0)

      expect(
        duties.every(
          (d: { endTime: Duty['endTime'] }) => new Date(d.endTime).getTime() <= new Date('2026-10-01').getTime(),
        ),
      ).toBeTruthy()
    })

    test('GET /duties?createdAt=2025-11-19 should return 200  if there are any duties in the db with that created date or after', async () => {
      await dutyService.insertDuty(dutyDb({ createdAt: new Date('2025-11-19T00:00:00Z') }))

      const response = await server.inject({
        method: 'GET',
        url: '/duties?createdAt=2025-11-19',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(duties.length).toBeGreaterThan(0)

      expect(
        duties.every(
          (d: { createdAt: DutyDB['createdAt'] }) =>
            new Date(d.createdAt).getTime() >= new Date('2025-11-19').getTime(),
        ),
      ).toBeTruthy()
    })

    test('GET /duties?updatedAt=2025-11-19 should return 200  if there are any duties in the db with that updated date or after', async () => {
      await dutyService.insertDuty(dutyDb({ updatedAt: new Date('2025-11-19T00:00:00Z') }))
      const response = await server.inject({
        method: 'GET',
        url: '/duties?updatedAt=2025-11-19',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(duties.length).toBeGreaterThan(0)

      expect(
        duties.every(
          (d: { updatedAt: DutyDB['updatedAt'] }) =>
            new Date(d.updatedAt).getTime() >= new Date('2025-11-19').getTime(),
        ),
      ).toBeTruthy()
    })

    test('GET /duties?location=34.7812&location=32.0853 should return 200  if there are any duties in the db with that location', async () => {
      await dutyService.insertDuty(dutyDb({ location: location }))
      const response = await server.inject({
        method: 'GET',
        url: `/duties?location=${location[0]}&location=${location[1]}`,
      })

      const responseBody = response.json()
      const duties = responseBody.data as Duty[]

      expect(response.statusCode).toBe(200)
      expect(duties.length).toBeGreaterThan(0)

      expect(duties.every(d => d.location.every(c => location.includes(c)))).toBeTruthy()
    })

    test('GET /duties?maxRank=5 should return 200  if there are any duties in the db with that maxRank', async () => {
      await dutyService.insertDuty(dutyDb({ maxRank: 5 }))
      const response = await server.inject({
        method: 'GET',
        url: '/duties?maxRank=5',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(duties.length).toBeGreaterThan(0)

      expect(duties.every((d: { maxRank: Duty['maxRank'] }) => d.maxRank === 5)).toBeTruthy()
    })

    test('GET /duties?minRank=5 should return 200  if there are any duties in the db with that minRank', async () => {
      await dutyService.insertDuty(dutyDb({ maxRank: 5, minRank: 5 }))
      const response = await server.inject({
        method: 'GET',
        url: '/duties?minRank=5',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(duties.length).toBeGreaterThan(0)

      expect(duties.every((d: { minRank: Duty['minRank'] }) => d.minRank === 5)).toBeTruthy()
    })

    test('GET /duties?soldiersRequired=5 should return 200  if there are any duties in the db with that amount of soldiersRequired', async () => {
      await dutyService.insertDuty(dutyDb({ soldiersRequired: 5 }))
      const response = await server.inject({
        method: 'GET',
        url: '/duties?soldiersRequired=5',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(duties.length).toBeGreaterThan(0)

      expect(duties.every((d: { soldiersRequired: Duty['soldiersRequired'] }) => d.soldiersRequired === 5)).toBeTruthy()
    })

    test('GET /duties?status="unscheduled" should return 200  if there are any duties in the db with that status', async () => {
      await dutyService.insertDuty(dutyDb({ status: 'unscheduled' }))
      const response = await server.inject({
        method: 'GET',
        url: '/duties?status=unscheduled',
      })

      const responseBody = response.json()
      const duties = responseBody.data

      expect(response.statusCode).toBe(200)
      expect(duties.length).toBeGreaterThan(0)

      expect(duties.every((d: { status: Duty['status'] }) => d.status === 'unscheduled')).toBeTruthy()
    })

    test('GET /duties?soldiers=1234567&soldiers=1234568 should return 200  if there are any duties in the db with those soldiers', async () => {
      await dutyService.insertDuty(dutyDb({ soldiers: soldierIds }))
      const response = await server.inject({
        method: 'GET',
        url: `/duties?soldiers=${soldierIds[0]}&soldiers=${soldierIds[1]}`,
      })

      const responseBody = response.json()
      const duties = responseBody.data as Duty[]
      expect(response.statusCode).toBe(200)
      expect(duties.length).toBeGreaterThan(0)

      expect(duties.every(d => d.soldiers.every(s => soldierIds.includes(s)))).toBeTruthy()
    })

    test('GET /duties?status="none" should return 404  if there aren`t any duties in the db with those params', async () => {
      await dutyService.insertDuty(dutyDb({ status: 'unscheduled' }))
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
    test('GET /duties?name=NonExistentDutyName should return 404 if no duties match the name', async () => {
      await dutyService.insertDuty(dutyDb({ name: 'Guard the Main Gate' }))
      const response = await server.inject({
        method: 'GET',
        url: '/duties?name=NonExistentDutyName',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe(`No duties found with the params: {"name":"NonExistentDutyName"}`)
    })

    test('GET /duties?description=UniqueDescription should return 404 if no duties match the description', async () => {
      await dutyService.insertDuty(dutyDb({ description: 'Soldiers will secure the main gate during night hours.' }))
      const response = await server.inject({
        method: 'GET',
        url: '/duties?description=UniqueDescription',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe(`No duties found with the params: {"description":"UniqueDescription"}`)
    })

    test('GET /duties?value=999 should return 404 if no duties match the value', async () => {
      await dutyService.insertDuty(dutyDb({ value: 100 }))
      const response = await server.inject({
        method: 'GET',
        url: '/duties?value=999',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe(`No duties found with the params: {"value":999}`)
    })

    test('GET /duties?constraints=UnknownConstraint should return 404 if no duties match the constraints', async () => {
      await dutyService.insertDuty(dutyDb({ constraints: ['No phones', 'Night duty'] }))
      const response = await server.inject({
        method: 'GET',
        url: '/duties?constraints=UnknownConstraint',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe(`No duties found with the params: {"constraints":["UnknownConstraint"]}`)
    })

    test('GET /duties?startTime=3000-01-01 should return 404 if all duties start before the provided date', async () => {
      await dutyService.insertDuty(dutyDb({ startTime: new Date('2026-12-01T00:00:00Z') }))
      const response = await server.inject({
        method: 'GET',
        url: '/duties?startTime=3000-01-01',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe(`No duties found with the params: {"startTime":"3000-01-01T00:00:00.000Z"}`)
    })

    test('GET /duties?endTime=2000-01-01 should return 404 if all duties end after the provided date', async () => {
      await dutyService.insertDuty(dutyDb({ endTime: new Date('2026-09-15T00:00:00Z') }))
      const response = await server.inject({
        method: 'GET',
        url: '/duties?endTime=2000-01-01',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe(`No duties found with the params: {"endTime":"2000-01-01T00:00:00.000Z"}`)
    })
    test('GET /duties?value=abc should return 400 if value is not a number', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/duties?value=abc',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toContain(`✖ querystring/value Invalid input: expected number, received NaN`)
    })

    test('GET /duties?maxRank=abc should return 400 if maxRank is not a number', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/duties?maxRank=abc',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toContain(`✖ querystring/maxRank Invalid input: expected number, received NaN`)
    })

    test('GET /duties?maxRank=8 should return 400 if maxRank is bigger than allowed in the schema', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/duties?maxRank=8',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toContain(`querystring/maxRank Too big: expected number to be <=6`)
    })

    test('GET /duties?soldiersRequired=-1 should return 400 if soldiersRequired is negative', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/duties?soldiersRequired=-1',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toContain(`✖ querystring/soldiersRequired Too small: expected number to be >=0`)
    })

    test('GET /duties?soldiersRequired=abc should return 400 if soldiersRequired is not a number', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/duties?soldiersRequired=abc',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toContain(
        `✖ querystring/soldiersRequired Invalid input: expected number, received NaN`,
      )
    })

    test('GET /duties?startTime=invalid-date-format should return 400 if startTime is not a valid date string', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/duties?startTime=invalid-date-format',
      })

      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toContain(`✖ querystring/startTime Could not coerce value into a valid Date`)
    })

    test('GET /duties?name=DutyA&value=50 should return 200 and only duties matching both name and value', async () => {
      await dutyService.insertDuty(dutyDb({ name: 'DutyA', value: 50 }))
      await dutyService.insertDuty(dutyDb({ name: 'DutyA', value: 100 }))
      await dutyService.insertDuty(dutyDb({ name: 'DutyB', value: 50 }))

      const response = await server.inject({
        method: 'GET',
        url: '/duties?name=DutyA&value=50',
      })

      const duties = response.json().data

      expect(response.statusCode).toBe(200)
      expect(duties.length).toBe(1)
      expect(
        duties.every((d: { name: Duty['name']; value: Duty['value'] }) => d.name === 'DutyA' && d.value === 50),
      ).toBeTruthy()
    })
  })

  describe('DELETE /duties/:_id', () => {
    test('DELETE /duties/:_id should delete the duty and return 204 if the duty was deleted successfully', async () => {
      const id = (await dutyService.insertDuty(dutyDb({ status: 'unscheduled' })))._id

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

    test('DELETE /duties/:_id should return 409 if the duty is already scheduled', async () => {
      const id = (await dutyService.insertDuty(dutyDb({ status: 'scheduled' })))._id
      const response = await server.inject({
        method: 'DELETE',
        url: `/duties/${id}`,
      })

      expect(response.statusCode).toBe(409)
      expect(response.json().message).toBe('Cannot change scheduled duties')
    })
  })

  describe('PATCH /duties/:_id', () => {
    test('PATCH /duties/:_id should return 200 if  a duty with that id exists and the body request matches the schema', async () => {
      const beforeDuty = await dutyService.insertDuty(dutyDb())
      const beforeHistory = beforeDuty.statusHistory

      const payload = {
        description: 'Routine check and repair of military equipment in the armory.',
        name: 'Equipment Maintenance',
        status: 'status',
      }
      const response = await server.inject({
        method: 'PATCH',
        payload,
        url: `/duties/${beforeDuty._id}`,
      })
      const duty = response.json().data
      const afterHistory = duty.statusHistory

      expect(response.statusCode).toBe(200)
      expect(duty).toMatchObject({
        description: payload.description,
        name: payload.name,
      })
      expect(new Date(duty.createdAt).toISOString()).toBe(new Date(beforeDuty.createdAt).toISOString())
      expect(new Date(duty.updatedAt).getTime()).toBeGreaterThan(new Date(beforeDuty.updatedAt).getTime())
      expect(afterHistory.length).toBe(beforeHistory.length + 1)

      const lastEntry = afterHistory[afterHistory.length - 1]

      expect(lastEntry.status).toBe(payload.status)

      const prevEntry = beforeHistory[beforeHistory.length - 1]
      expect(new Date(lastEntry.date).getTime()).toBeGreaterThan(new Date(prevEntry!.date).getTime())
    })

    test('PATCH /duties/:_id should return 400  if the request`s body contains unrecognized keys', async () => {
      const id = (await dutyService.insertDuty(dutyDb()))._id
      const payload = {
        id: '1234567',
      }

      const response = await server.inject({
        method: 'PATCH',
        payload,
        url: `/duties/${id}`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/ Unrecognized key: "id"')
    })

    test('PATCH /duties/:_id should return 404  if there isn`t a duty with that id', async () => {
      const id = '691d7ed9aa601e3c057e90bd'
      const payload = {
        name: 'Name',
      }

      const response = await server.inject({
        method: 'PATCH',
        payload,
        url: `/duties/${id}`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe('No duty found with the id: 691d7ed9aa601e3c057e90bd')
    })

    test('PATCH /duties/:_id should return 404  if there isn`t any fileds', async () => {
      const id = (await dutyService.insertDuty(dutyDb()))._id
      const payload = {}

      const response = await server.inject({
        method: 'PATCH',
        payload,
        url: `/duties/${id}`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/ At least one field must be provided to update')
    })

    test('PATCH /duties/:_id should return 409  if the duty is already scheduled', async () => {
      const id = (await dutyService.insertDuty(dutyDb({ status: 'scheduled' })))._id
      const payload = { name: 'Name' }

      const response = await server.inject({
        method: 'PATCH',
        payload,
        url: `/duties/${id}`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(409)
      expect(responseBody.message).toBe('Cannot change scheduled duties')
    })
  })

  describe('PUT /duties/:_id/constraints', () => {
    test('PUT /duties/:_id/constraints should return 200  if a duty with that id exists and the request body fits the schema', async () => {
      const beforeDuty = await dutyService.insertDuty(dutyDb())
      const oldConstraints = beforeDuty?.constraints || []
      const oldUpdateDate = new Date(beforeDuty.updatedAt)

      const payload = ['Wear protective gloves', 'Follow safety protocol']

      const response = await server.inject({
        method: 'PUT',
        payload,
        url: `/duties/${beforeDuty._id}/constraints`,
      })
      const responseBody = response.json()
      const duty = responseBody.data
      const expectedConstraints = [...oldConstraints, ...payload]
      expect(response.statusCode).toBe(200)
      expect(duty.constraints).toEqual(expectedConstraints)
      expect(new Date(duty.updatedAt).getTime()).toBeGreaterThan(oldUpdateDate.getTime())
    })

    test('PUT /duties/:_id/constraints should return 400  if the request body is empty', async () => {
      const id = (await dutyService.insertDuty(dutyDb()))._id
      const payload: string[] = []

      const response = await server.inject({
        method: 'PUT',
        payload,
        url: `/duties/${id}/constraints`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(400)
      expect(responseBody.message).toBe('✖ body/ At least one constrain must be provided to update')
    })

    test('PUT /duties/:_id/constraints should return 404  if there is no duty with that id', async () => {
      const id = '691d7ed9aa601e3c057e90bd'
      const payload = ['Limit']

      const response = await server.inject({
        method: 'PUT',
        payload,
        url: `/duties/${id}/constraints`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe('No duty found with the id: 691d7ed9aa601e3c057e90bd')
    })

    test('PUT /duties/:_id/constraints should return 409  if the duty is already scheduled', async () => {
      const id = (await dutyService.insertDuty(dutyDb({ status: 'scheduled' })))._id
      const payload = ['Limit']

      const response = await server.inject({
        method: 'PUT',
        payload,
        url: `/duties/${id}/constraints`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(409)
      expect(responseBody.message).toBe('Cannot change scheduled duties')
    })
  })
})