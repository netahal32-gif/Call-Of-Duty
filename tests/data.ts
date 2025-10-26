import type { FastifyInstance } from 'fastify'
import { createSoldierService } from '../src/services/soldier-service.js'
import type { SoldierOutput, SoldierRank } from '../src/types/soldier.js'
import { ranks } from '../src/types/soldier.js'

const id = '1000001'
export const defaultSoldierInput: SoldierOutput = {
  _id: id,
  createdAt: new Date(),
  limitations: ['sunlight', 'running'],
  name: 'John Doe',
  rank: { name: 'major', value: 5 },
  updatedAt: new Date(),
}

export const makeSoldier = async (server: FastifyInstance, input: Partial<SoldierOutput> = {}) => {
  const { _id, limitations, name, rank, createdAt, updatedAt } = { ...defaultSoldierInput, ...input }

  const normalizeRank = (r: SoldierRank) => ({
    name: r.name ?? ranks[r.value!],
    value: r.value ?? ranks.indexOf(r.name!),
  })

  const body: SoldierOutput = {
    _id,
    createdAt,
    limitations: [...limitations],
    name,
    rank: normalizeRank(rank),
    updatedAt,
  }
  await createSoldierService(server).insertSoldier(body)

  return _id
}
