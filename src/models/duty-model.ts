import type { FastifyInstance } from 'fastify'
import type { DutyOutput } from '../types/duty.js'

export const dutyCollection = (server: FastifyInstance) => {
  return server.mongo.db!.collection<DutyOutput>('duties')
}