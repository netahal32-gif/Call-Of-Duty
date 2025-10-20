import type { FastifyInstance } from 'fastify'
import type { Soldier, SoldierOutput } from './schemas/soldier.js'
import { soldierResponseSchema,soldierSchema, soldierIdParamSchema } from './schemas/soldier.js'
import { postSoldier, getSoldier } from './utils/soldierHelpers.js'

const soldierRoutes = async (server: FastifyInstance) => {
  server.post<{ Body: Soldier; Replay: { 'Soldier added successfully': SoldierOutput } }>(
    '/',
    {
      schema: {
        body: soldierSchema,
        response: { 201: soldierResponseSchema },
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

  server.get<{ Params: { id: string }; Replay: SoldierOutput }>(
    '/:id',
    {
      schema: {
        params: soldierIdParamSchema,
        response: { 200: soldierResponseSchema },
      },
    },
    async (req, res) => {
      try {
        const soldier = await getSoldier(server, req.params.id)
        res.status(200).send({
          message: "Soldier retrieved successfully",
          data: soldier,
        })
      } catch (err: any) {
        if (err.statusCode === 404) {
          return res.status(404).send({
            error: 'Soldier not found',
          })
        }
      }
    }
  )
}

export default soldierRoutes
