import type { FastifyInstance } from 'fastify'
import buildServer from '../src/server.js'
import { makeDuty, makeSoldier } from './data.js'

describe('Justice Routes', () => {
  let server: FastifyInstance

  beforeAll(async () => {
    const baseUrl = process.env.MONGO_URL!
    const url = `${baseUrl}-justice`
    process.env.MONGO_URL = url
    server = await buildServer()
  })

  afterAll(async () => {
    const db = server.mongo.db
    if (db) await db.dropDatabase()
    await server.close()
  })

  beforeEach(async () => {
    const db = server.mongo.db
    if (db) await db.dropDatabase()+
  }) 

  describe('GET /justice-board', () => {
    test('GET /justice-board should return 200 if there are any soldiers in the db', async () => {
      const soldier1Id =( await makeSoldier(server, { _id: '1234567' }))._id
      const soldier2Id = (await makeSoldier(server, { _id: '1234568' }))._id
      const soldier3Id = (await makeSoldier(server, { _id: '1234569' }))._id
      const soldier4Id =( await makeSoldier(server, { _id: '1234560' }))._id
      await makeDuty(server, { soldiers: [soldier1Id, soldier2Id, soldier3Id] })
      await makeDuty(server, { soldiers: [soldier1Id, soldier2Id] })
      await makeDuty(server, { soldiers: [soldier1Id] })
      const response = await server.inject({
        method: 'GET',
        url: `/justice-board`,
      })
      const justiceBoard = response.json().data
      const soldier1 = justiceBoard.find((x: { _id: string }) => x._id === soldier1Id)
      const soldier2 = justiceBoard.find((x: { _id: string }) => x._id === soldier2Id)
      const soldier3 = justiceBoard.find((x: { _id: string }) => x._id === soldier3Id)
      const soldier4 = justiceBoard.find((x: { _id: string }) => x._id === soldier4Id)

      expect(response.statusCode).toBe(200)
      expect(justiceBoard.length).toBe(4)
      expect(soldier1.score).toBe(3)
      expect(soldier2.score).toBe(2)
      expect(soldier3.score).toBe(1)
      expect(soldier4.score).toBe(0)
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
      const soldier1Id = (await makeSoldier(server))._id
      await makeDuty(server, { soldiers: [soldier1Id] })
      const response = await server.inject({
        method: 'GET',
        url: `/justice-board/${soldier1Id}`,
      })
      const justiceBoard = response.json().data
      expect(response.statusCode).toBe(200)
      expect(justiceBoard.score).toBe(1)
    })

    test('GET /justice-board should return 404 if there isn`t a soldier with that id', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/justice-board/0000000`,
      })
      const responseBody = response.json()

      expect(response.statusCode).toBe(404)
      expect(responseBody.message).toBe('No soldier found with id 0000000 ')
    })
  })
})
