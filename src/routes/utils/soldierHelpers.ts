import type { FastifyInstance } from 'fastify'
import type { Soldier, SoldierOutput } from '../schemas/soldier.js'
import { soldierSchema } from '../schemas/soldier.js'

const dbCheck = (server: FastifyInstance) => {
  const db = server.mongo.db
  if (!db) throw new Error('MongoDB not connected')
  return db
}

export const postSoldier = async (server: FastifyInstance, body: Soldier): Promise<SoldierOutput> => {
  const db = dbCheck(server)

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

export const getSoldier = async (server: FastifyInstance, Id: string): Promise<SoldierOutput> => {
  const db = dbCheck(server)
  
  const soldier = await db.collection<SoldierOutput>('soldiers').findOne({ id :Id})

  if (!soldier) {
    const err: any = new Error("Soldier not found");
    err.statusCode = 404;
    throw err;
  }

  return soldier
}
