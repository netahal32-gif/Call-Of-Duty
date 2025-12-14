import type { Filter, UpdateFilter } from 'mongodb'
import { soldierCollection } from '../models/soldier-model.js'
import type { AppServer } from '../server.js'
import type { Soldier, SoldierBodyToUpdate, SoldierDb, SoldierQuery } from '../types/soldier.js'
import { CustomError, NoSoldierError } from '../utils/error/custom-error.js'

export const createSoldierService = (server: AppServer) => {
  const collection = soldierCollection(server)

  const getSoldierById = async (_id: string) => {
    const soldier = await collection.findOne({ _id })
    if (!soldier) throw new NoSoldierError(_id)
    return soldier
  }

  const insertSoldier = async (body: Soldier) => {
    const now = new Date()
    const soldier: SoldierDb = {
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

    const soldiers = await collection.find(mongoQuery).toArray()
    if (!soldiers.length) throw new CustomError(404, `No soldiers found with the params: ${JSON.stringify(query)}`)
    return soldiers
  }

  const updateSoldier = async (_id: string, body: SoldierBodyToUpdate) => {
    const updatedFields: UpdateFilter<SoldierDb> = { ...body }

    updatedFields.updatedAt = new Date()

    const soldier = await collection.findOneAndUpdate({ _id }, { $set: updatedFields }, { returnDocument: 'after' })
    if (!soldier) throw new NoSoldierError(_id)
    return soldier
  }

  const deleteSoldier = async (_id: string) => {
    const result = await collection.deleteOne({ _id })
    if (!result.deletedCount) throw new NoSoldierError(_id)
    return result
  }

  const addLimitationsToSoldiers = async (_id: string, body: string[]) => {
    const soldier = await collection.findOneAndUpdate(
      { _id },
      {
        $addToSet: { limitations: { $each: body } },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: 'after' },
    )
    if (!soldier) throw new NoSoldierError(_id)
    return soldier
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
