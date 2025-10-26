import type { Filter, UpdateFilter } from 'mongodb'
import { ObjectId } from 'mongodb'
import { dutyCollection } from '../models/duty-model.js'
import type { AppServer } from '../server.js'
import type { BaseDuty, DutyOutput, DutyQuery, UpdateDuty, Duty } from '../types/duty.js'

export const createDutyService = (server: AppServer) => {
  const collection = dutyCollection(server)

  const getDuty = async (id: string) => {
    const objectId = new ObjectId(id)
    return collection.findOne({ _id: objectId }, { projection: { _id: 0 } })
  }

  const insertDuty = async (body: BaseDuty & Partial<Duty>) => {
    const currentDate = new Date()
    const duty: DutyOutput = {
      ...body,
      soldiers: body.soldiers ?? [],
      status: body.status ?? 'unscheduled',
      statusHistory: body.statusHistory ?? [{ date: currentDate, status: 'unscheduled' }],
      updatedAt: currentDate,
      createdAt: currentDate,
    }

    const result = await collection.insertOne(duty)
    return { ...duty, _id: result.insertedId }
  }

  const getDutiesByParams = async (query: DutyQuery) => {
    const mongoQuery: Filter<DutyOutput> = {}

    if (query.name) mongoQuery.name = new RegExp(query.name, 'i')
    if (query.description) mongoQuery.description = new RegExp(query.description, 'i')

    if (query.location) mongoQuery.location = query.location
    if (query.soldiersRequired) mongoQuery.soldiersRequired = query.soldiersRequired
    if (query.value) mongoQuery.value = query.value
    if (query.status) mongoQuery.status = query.status
    if (query.minRank) mongoQuery.minRank = query.minRank
    if (query.maxRank) mongoQuery.maxRank = query.maxRank

    if (query.startTime) mongoQuery.startTime = { $gte: new Date(query.startTime) }
    if (query.endTime) mongoQuery.endTime = { $lte: new Date(query.endTime) }
    if (query.createdAt) mongoQuery.createdAt = { $gte: new Date(query.createdAt) }
    if (query.updatedAt) mongoQuery.updatedAt = { $gte: new Date(query.updatedAt) }

    if (query.constraints?.length) mongoQuery.constraints = { $all: query.constraints }
    if (query.soldiers?.length) mongoQuery.soldiers = { $all: query.soldiers }

    return collection.find(mongoQuery, { projection: { _id: 0 } }).toArray()
  }

  const updateDuty = async (id: string, body: UpdateDuty) => {
    const duty = await getDuty(id)
    if (!duty) return null
    if (duty.status === 'scheduled') return 'Duty scheduled'
    const updatedFields: UpdateFilter<DutyOutput> = { ...body }

    if (body.status && body.status !== duty!.status) {
      updatedFields.statusHistory = [...(duty!.statusHistory || []), { date: new Date(), status: body.status }]
    }

    updatedFields.updatedAt = new Date()

    return collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedFields },
      {
        projection: { _id: 0 },
        returnDocument: 'after',
      },
    )
  }

  const deleteDuty = async (id: string) => {
    const objectId = new ObjectId(id)
    const result = await collection.deleteOne({ _id: objectId })
    if (!result.deletedCount) return null

    return result
  }

  const addLimitationsToDuty = async (id: string, body: string[]) => {
    const duty = await getDuty(id)
    if (!duty) return null
    if (duty!.status === 'scheduled') return 'Duty scheduled'

    return collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $addToSet: { constraints: { $each: body } },
        $set: { updatedAt: new Date() },
      },
      {
        projection: { _id: 0 },
        returnDocument: 'after',
      },
    )
  }

  return {
    addLimitationsToDuty,
    deleteDuty,
    getDutiesByParams,
    getDuty,
    insertDuty,
    updateDuty,
  }
}
