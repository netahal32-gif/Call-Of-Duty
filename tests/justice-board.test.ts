import type { FastifyInstance } from 'fastify'
import buildServer from '../src/server.js'
import { createDutyService } from '../src/services/duty-service.js'
import { createSoldierService } from '../src/services/soldier-service.js'
import type { DutyDB } from '../src/types/duty.js'
import type { SoldierDb } from '../src/types/soldier.js'
import { dutyDbBody, soldierDbBody } from './data.js'

describe('Justice Routes', () => {
  let server: FastifyInstance
  let soldierService: ReturnType<typeof createSoldierService>
  let dutyService: ReturnType<typeof createDutyService>
  let insertSoldiers: (params: Partial<SoldierDb>[]) => void
  let insertDuties: (params: Partial<DutyDB>[]) => void

  beforeAll(async () => {
    const baseUrl = process.env.MONGO_URL!
    const url = `${baseUrl}-justice`
    process.env.MONGO_URL = url
    server = await buildServer()

    soldierService = createSoldierService(server)
    dutyService = createDutyService(server)

    insertSoldiers = async (params: Partial<SoldierDb>[]) =>
      await soldierService.insertManySoldiers(params.map(soldier => soldierDbBody(soldier)))
    insertDuties = async (params: Partial<DutyDB>[]) =>
      await dutyService.insertManyDuties(params.map(soldier => dutyDbBody(soldier)))
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

  describe('GET /justice-board', () => {
    test('GET /justice-board should return 200 if there are any soldiers in the db', async () => {
      const ids = ['1234567', '1234568', '1234569', '1234560'] as const
      const [soldier0, soldier1, soldier2, soldier3] = ids
      const [value0, value1, value2] = [200, 300, 400]

      insertSoldiers(ids.map(_id => ({ _id })))
      await insertDuties([
        { soldiers: [soldier0, soldier1, soldier2], value: value0 },
        { soldiers: [soldier0, soldier1], value: value1 },
        { soldiers: [soldier0], value: value2 },
      ])

      const response = await server.inject({
        method: 'GET',
        url: `/justice-board`,
      })
      const justiceScoreArray = response.json().data
      const scoreOf = (id: string) => justiceScoreArray.find((soldier: { _id: string }) => soldier._id === id)?.score

      expect(response.statusCode).toBe(200)
      expect(justiceScoreArray.length).toBe(4)
      expect(scoreOf(soldier0!)).toBe(value0 + value1 + value2)
      expect(scoreOf(soldier1!)).toBe(value0 + value1)
      expect(scoreOf(soldier2!)).toBe(value0)
      expect(scoreOf(soldier3!)).toBe(0)
    })

    test('GET /justice-board should return 404 if there are no soldiers in the db', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/justice-board`,
      })
      const responseBody = response.json()
      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe('No soldiers found in the db')
    })
  })

  describe('GET /justice-board/:_id', () => {
    test('GET /justice-board should return 200 if there a soldier with that id', async () => {
      const soldierId = '9234567'
      const [value0, value1, value2] = [200, 300, 400]

      await insertSoldiers([{ _id: soldierId }])
      await insertDuties([
        { soldiers: [soldierId], value: value0 },
        { soldiers: [soldierId], value: value1 },
        { value: value2 },
      ])

      const response = await server.inject({
        method: 'GET',
        url: `/justice-board/${soldierId}`,
      })
      const justiceScoreArray = response.json().data
      expect(response.statusCode).toBe(200)
      expect(justiceScoreArray.score).toBe(value0 + value1)
    })

    test('GET /justice-board should return 404 if there isn`t a soldier with that id', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/justice-board/0000000`,
      })
      const responseBody = response.json()

      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe('No soldier found with the id: 0000000')
    })
  })
})
