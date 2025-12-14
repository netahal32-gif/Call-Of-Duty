import type { FastifyInstance } from 'fastify'
import type { DutyDB } from '../types/duty.js'

export const dutyCollection = (server: FastifyInstance) => {
  return server.mongo.db!.collection<DutyDB>('duties')
}
