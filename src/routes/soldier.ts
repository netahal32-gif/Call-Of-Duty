import type { FastifyInstance } from 'fastify'
import type { Soldier, SoldierOutput } from './schemas/soldier.js'
import { responseSchema, soldierSchema } from './schemas/soldier.js'
import { postSoldier } from './utils/soldierHelpers.js'

const soldierRoutes = async (server: FastifyInstance) => {
  server.post<{ Body: Soldier; Replay: { 'Soldier added successfully': SoldierOutput } }>(
    '/',
    {
      schema: {
        body: soldierSchema,
        response: { 201: responseSchema },
      },
    },
    async (req, res) => {
      const soldier = await postSoldier(server, req.body)
      res.status(201).send({
        data: soldier,
        message: 'Soldier added successfully',
      })
    },
  )

  server.get<{ Body: Soldier['_id']; Replay: { 'Soldier added successfully': SoldierOutput } }>(
    '/:id',
    {},
    async (req, res) => {},
  )
}

export default soldierRoutes
