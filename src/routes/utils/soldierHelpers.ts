import type { FastifyInstance } from 'fastify'
import type { Soldier, SoldierOutput } from '../schemas/soldier.js'
import { soldierSchema } from '../schemas/soldier.js'

export const postSoldier = async (server: FastifyInstance, body: Soldier): Promise<SoldierOutput> => {
  const db = server.mongo.db
  if (!db) throw new Error('MongoDB not connected')

  const existing = await db.collection('soldiers').findOne({})
  if (!existing) {
    await db.createCollection('soldiers')
    server.log.info('Created "soldiers" collection')
  }

  const parseResult = soldierSchema.safeParse(body)
  if (!parseResult.success) {
    throw Error
  }

  const currentDate = new Date()
  const soldier: SoldierOutput = {
    ...parseResult.data,
    createdAt: currentDate,
    updatedAt: currentDate,
  }

  const collection = db.collection<SoldierOutput>('soldiers')
  await collection.insertOne(soldier)
  return soldier
}
