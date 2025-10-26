import type { FastifyInstance } from 'fastify'
import { createDutyService } from '../src/services/duty-service.js'
import { createSoldierService } from '../src/services/soldier-service.js'
import type {  DutyOutput } from '../src/types/duty.js'
import type { SoldierOutput, SoldierRank } from '../src/types/soldier.js'
import { ranks } from '../src/types/soldier.js'
import { defaultDutyInput } from './db-insert.js'

const soldierId = '1000001'

const normalizeRank = (rank: SoldierRank): SoldierRank => ({
  name: rank.name ?? ranks[rank.value!],
  value: rank.value ?? ranks.indexOf(rank.name!),
})

const clone = <T>(value: T): T => structuredClone(value)

export const defaultSoldierInput: SoldierOutput = {
  _id: soldierId,
  createdAt: new Date(),
  limitations: ['sunlight', 'running'],
  name: 'John Doe',
  rank: { name: 'major', value: 5 },
  updatedAt: new Date(),
}

export const defaultDutyOutput: DutyOutput = {
  ...defaultDutyInput,
  createdAt: new Date(),
  soldiers: [],
  status: 'unscheduled',
  statusHistory: [{ date: new Date(), status: 'unscheduled' }],
  updatedAt: new Date(),
}

export const makeSoldier = async (server: FastifyInstance, input: Partial<SoldierOutput> = {}) => {
  const merged = { ...defaultSoldierInput, ...input }

  const normalized: SoldierOutput = {
    ...merged,
    limitations: clone(merged.limitations),
    rank: normalizeRank(merged.rank),
  }

  await createSoldierService(server).insertSoldier(normalized)
  return normalized._id
}

export const makeDuty = async (server: FastifyInstance, input: Partial<DutyOutput> = {}) => {
  const merged: DutyOutput = {
    ...defaultDutyOutput,
    ...input,
    constraints: clone(input.constraints ?? defaultDutyOutput.constraints),
    location: clone(input.location ?? defaultDutyOutput.location),
    soldiers: clone(input.soldiers ?? defaultDutyOutput.soldiers),
    statusHistory: clone(input.statusHistory ?? defaultDutyOutput.statusHistory),
  }
  const result = await createDutyService(server).insertDuty(merged)
  return result._id
}
