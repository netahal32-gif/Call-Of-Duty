import type { Filter, UpdateFilter } from 'mongodb'
import { soldierCollection } from '../models/soldier-model.js'
import type { AppServer } from '../server.js'
import type { Soldier, SoldierBodyToUpdate, SoldierOutput, SoldierQuery } from '../types/soldier.js'

export const createSoldierService = (server: AppServer) => {
  const collection = soldierCollection(server)

  const getSoldierById = async (_id: string) => {
    return collection.findOne({ _id })
  }

  const insertSoldier = async (body: Soldier) => {
    const now = new Date()
    const soldier: SoldierOutput = {
      ...body,
      createdAt: now,
      updatedAt: now,
    }

    await collection.insertOne(soldier)
    return soldier
  }

  const getSoldierByParams = async (query: SoldierQuery) => {
    const mongoQuery: Filter<Soldier> = {}

    if (query.name) mongoQuery.name = new RegExp(query.name, 'i')
    if (query.rankName) mongoQuery['rank.name'] = query.rankName
    if (query.rankValue !== undefined) mongoQuery['rank.value'] = query.rankValue
    if (query.limitations) mongoQuery.limitations = { $all: query.limitations }
    if (query.createdAt) mongoQuery.createdAt = { $gte: new Date(query.createdAt) }
    if (query.updatedAt) mongoQuery.updatedAt = { $gte: new Date(query.updatedAt) }

    return collection.find(mongoQuery).toArray()
  }

  const updateSoldier = async (_id: string, body: SoldierBodyToUpdate) => {
    const updatedFields: UpdateFilter<SoldierOutput> = { ...body }

    updatedFields.updatedAt = new Date()

    return collection.findOneAndUpdate({ _id }, { $set: updatedFields }, { returnDocument: 'after' })
  }

  const deleteSoldier = async (_id: string) => {
    const result = await collection.deleteOne({ _id })
    if (!result.deletedCount) return null

    return result
  }

  const addLimitationsToSoldiers = async (_id: string, body: string[]) => {
    return collection.findOneAndUpdate(
      { _id },
      {
        $addToSet: { limitations: { $each: body } },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: 'after' },
    )
  }

  return {
    addLimitationsToSoldiers,
    deleteSoldier,
    getSoldierById,
    getSoldierByParams,
    insertSoldier,
    updateSoldier,
  }
}
