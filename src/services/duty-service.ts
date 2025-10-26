import type { Filter, UpdateFilter } from 'mongodb'
import { ObjectId } from 'mongodb'
import { dutyCollection } from '../models/duty-model.js'
import type { AppServer } from '../server.js'
import type { Duty, DutyDB, DutyQuery, UpdateDuty } from '../types/duty.js'
import { CustomError, NoDutyError } from '../utils/error/custom-error.js'

export const createDutyService = (server: AppServer) => {
  const collection = dutyCollection(server)

  const CheckDutyStatus = async (id: string) => {
    const duty = await getDuty(id)
    if (!duty) throw new NoDutyError(id)
    if (duty.status === 'scheduled') throw new CustomError(409, 'Cannot change scheduled duties')
    return duty
  }

  const getDuty = async (id: string) => {
    const duty = await collection.findOne({ _id: new ObjectId(id) }, { projection: { _id: 0 } })
    if (!duty) throw new NoDutyError(id)
    return duty
  }

  const insertDuty = async (body: Duty) => {
    const currentDate = new Date()
    const duty: DutyDB = {
      ...body,
      createdAt: currentDate,
      updatedAt: currentDate,
    }

    const result = await collection.insertOne(duty)
    return { ...duty, _id: result.insertedId }
  }

  const getDutiesByParams = async (query: DutyQuery) => {
    const mongoQuery: Filter<DutyDB> = { ...query }

    // const transformers = {
    // name: (v: Duty["name"]) => new RegExp(v, "i"),
    //   description: (v: Duty["description"]) => new RegExp(v, "i"),

    //     startTime: (v: Duty["startTime"]) => ({ $gte: new Date(v) }),
    //       createdAt: (v: Duty["createdAt"]) => ({ $gte: new Date(v) }),
    //         updatedAt: (v: Duty["updatedAt"]) => ({ $gte: new Date(v) }),
    //           endTime: (v: Duty["endTime"]) => ({ $lte: new Date(v) }),

    //             constraints: (v: Duty["constraints"]) => ({ $all: v }),
    //               soldiers: (v: Duty["soldiers"]) => ({ $all: v }),
    // } as const

    // for (const [key, value] of Object.entries(query)) {
    //   if (!value) continue

    //   mongoQuery[key] = key in transformers
    //     ? transformers[key](value)
    //     : value
    // }

    // const transformers = {
    //   name: (v: Duty["name"]) => new RegExp(v, "i"),
    //   description: (v: Duty["description"]) => new RegExp(v, "i"),

    //   startTime: (v: Duty["startTime"]) => ({ $gte: new Date(v) }),
    //   createdAt: (v: Duty["createdAt"]) => ({ $gte: new Date(v) }),
    //   updatedAt: (v: Duty["updatedAt"]) => ({ $gte: new Date(v) }),
    //   endTime: (v: Duty["endTime"]) => ({ $lte: new Date(v) }),

    //   constraints: (v: Duty["constraints"]) => ({ $all: v }),
    //   soldiers: (v: Duty["soldiers"]) => ({ $all: v }),
    // };

    // const mongoQuery: Filter<Duty> = Object.fromEntries(
    //   Object.entries(query)
    //     .filter(([, v]) => v != null)
    //     .map(([k, v]) => [k, (transformers as Record<string, Function>)[k]?.(v) ?? v])
    // );


    // return collection.find(mongoQuery, { projection: { _id: 0 } }).toArray()
    if (query.name) mongoQuery.name = new RegExp(query.name, 'i')
    if (query.description) mongoQuery.description = new RegExp(query.description, 'i')

    if (query.startTime) mongoQuery.startTime = { $gte: new Date(query.startTime) }
    if (query.endTime) mongoQuery.endTime = { $lte: new Date(query.endTime) }

    if (query.minRank) mongoQuery.minRank = query.minRank
    if (query.maxRank) mongoQuery.maxRank = query.maxRank

    if (query.constraints?.length) mongoQuery.constraints = { $all: query.constraints }

    if (query.soldiers?.length) mongoQuery.soldiers = { $all: query.soldiers }

    if (query.createdAt) mongoQuery.createdAt = { $gte: new Date(query.createdAt) }

    if (query.updatedAt) mongoQuery.updatedAt = { $gte: new Date(query.updatedAt) }

    if (query.constraints?.length) mongoQuery.constraints = { $all: query.constraints }
    if (query.soldiers?.length) mongoQuery.soldiers = { $all: query.soldiers }

    const duties = await collection.find(mongoQuery, { projection: { _id: 0 } }).toArray()
    if (!duties.length) throw new CustomError(404, `No duties found with the params: ${JSON.stringify(query)}`)
    return duties
  }

  const updateDuty = async (id: string, body: UpdateDuty) => {
    const duty = await CheckDutyStatus(id)

    const updateOps: UpdateFilter<DutyDB> = {
      $set: { ...body, updatedAt: new Date() },
    }
    if (body.status && body.status !== duty.status) {
      updateOps.$push = {
        statusHistory: {
          date: new Date(),
          status: body.status,
        },
      }
    }

    return collection.findOneAndUpdate({ _id: new ObjectId(id) }, updateOps, {
      projection: { _id: 0 },
      returnDocument: 'after',
    })
  }

  const deleteDuty = async (id: string) => {
    await CheckDutyStatus(id)
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    if (!result.deletedCount) throw new NoDutyError(id)
    return result
  }

  const addConstraintsToDuty = async (id: string, body: string[]) => {
    await CheckDutyStatus(id)

    const updatedDuty = await collection.findOneAndUpdate(
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

    if (!updatedDuty) throw new NoDutyError(id)
    return updatedDuty
  }

  return {
    addConstraintsToDuty,
    deleteDuty,
    getDutiesByParams,
    getDuty,
    insertDuty,
    updateDuty,
  }
}
