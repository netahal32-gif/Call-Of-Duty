import type { FastifyInstance } from 'fastify'
import type { SoldierDb } from '../types/soldier.js'

export const soldierCollection = (server: FastifyInstance) => {
  return server.mongo.db!.collection<SoldierDb>('soldiers')
}
