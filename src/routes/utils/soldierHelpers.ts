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

export const getSoldier = async (server: FastifyInstance, Id: string) => {
  const db = dbCheck(server)

  const soldier = await db.collection<SoldierOutput>('soldiers').findOne({ id: Id })

  return soldier
}

export const getSoldierByParams = async (server: FastifyInstance, query: SoldierQuery) => {
  const db = dbCheck(server)

  const mongoQuery: any = {}

  if (query.name) mongoQuery.name = new RegExp(query.name, 'i')
  if (query.rank_name) mongoQuery['rank.name'] = query.rank_name
  if (query.rank_value !== undefined) mongoQuery['rank.value'] = query.rank_value
  if (query.limitations) mongoQuery.limitations = { $in: query.limitations }

  if (query.createdAt) mongoQuery.createdAt = { $gte: query.createdAt }
  if (query.updatedAt) mongoQuery.updatedAt = { $gte: query.updatedAt }

  const soldiers = await db
    .collection<SoldierOutput>('soldiers')
    .find(mongoQuery, { projection: { _id: 0 } })
    .toArray()

  return soldiers
}

export const deleteSoldier = async (server: FastifyInstance, Id: string) => {
  const db = dbCheck(server)
  const soldier = await getSoldier(server, Id);
  if (!soldier) {
    return null;
  }

  const result = await db.collection<SoldierOutput>('soldiers').deleteOne({ id: Id });

  if (result.deletedCount === 0) {
    return null;
  }

  return soldier;
}

export const patchSoldier = async (server: FastifyInstance, Id: string, body: UpdatedSoldier) => {
  const db = dbCheck(server)
  const soldier = await getSoldier(server, Id);
  if (!soldier) return null;
  if (!body || Object.keys(body).length === 0) return "Nothing to update";

  const updatedFields: any = {}

  if (body.name) updatedFields.name = body.name;
  if (body.rank?.name) updatedFields['rank.name'] = body.rank.name;
  if (body.rank?.value !== undefined) updatedFields['rank.value'] = body.rank.value;
  if (body.limitations) updatedFields.limitations = body.limitations.map(l => l.toLowerCase());

  updatedFields.updatedAt = new Date()

  const result = await db.collection<SoldierOutput>('soldiers').updateOne(
    { id: Id },
    { $set: updatedFields }
  );

  if (result.matchedCount === 0) return null;
  if (result.modifiedCount === 0) return "Nothing to update";

  return await getSoldier(server, Id);
}
