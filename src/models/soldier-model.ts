import type { FastifyInstance } from 'fastify'
import type { SoldierOutput } from '../types/soldier.js'

export const soldierCollection = (server: FastifyInstance) => {
  return server.mongo.db!.collection<SoldierOutput>('soldiers')
}