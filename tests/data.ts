import type { FastifyInstance } from 'fastify'
import { createSoldierService } from '../src/services/soldier-service.js'
import type { SoldierOutput, SoldierRank } from '../src/types/soldier.js'
import { ranks } from '../src/types/soldier.js'

export const defaultSoldierInput: SoldierOutput = {
  _id: '1000001',
  createdAt: new Date(),
  limitations: ['sunlight', 'running'],
  name: 'John Doe',
  rank: { name: 'major', value: 5 },
  updatedAt: new Date(),
}

const normalizeRank = (r: SoldierRank) => {
  if (!r.name && !r.value) {
    return { name: undefined, value: undefined }
  }

  return {
    name: r.name ?? ranks[r.value!],
    value: r.value ?? ranks.indexOf(r.name!),
  }
}

export const buildSoldier = (input: Partial<SoldierOutput>) => {
  const merged = { ...defaultSoldierInput, ...input }
  return { ...merged, rank: normalizeRank(merged.rank) }
}

export const makeSoldier = async (server: FastifyInstance, input: Partial<SoldierOutput> = {}) => {
  const body = buildSoldier(input)
  return createSoldierService(server).insertSoldier(body)
}