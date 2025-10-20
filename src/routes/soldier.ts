import type { FastifyInstance } from 'fastify'
import type { Soldier, SoldierOutput, SoldierQuery, UpdatedSoldier } from './schemas/soldier.js'
import { soldierResponseSchema, soldierSchema, soldierIdParamSchema, soldierQuerySchema, multiSoldierResponseSchema, soldierDeleteResponseSchema, updateSoldierSchema } from './schemas/soldier.js'
import { postSoldier, getSoldier, getSoldierByParams, deleteSoldier, patchSoldier } from './utils/soldierHelpers.js'

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

  server.get<{ Params: { id: string }; Replay: SoldierOutput }>('/:id',
    {
      schema: {
        params: soldierIdParamSchema,
        response: { 200: soldierResponseSchema },
      },
    },
    async (req, res) => {
      const soldier = await getSoldier(server, req.params.id)

      if (!soldier) {
        return res.status(404).send({
          status_code: 404,
          message: `No soldier found with the id: ${req.params.id}`,
        });
      }

      res.status(200).send({
        message: "Soldier retrieved successfully",
        data: soldier,
      })
    }
  )

  server.get<{ Querystring: SoldierQuery }>('/',
    {
      schema: {
        querystring: soldierQuerySchema,
        response: { 200: multiSoldierResponseSchema },
      },
    },
    async (req, res) => {
      const soldiers = await getSoldierByParams(server, req.query as SoldierQuery)

      if (!soldiers || soldiers.length === 0) {
        return res.status(404).send({
          status_code: 404,
          message: `No soldiers found with the params: ${JSON.stringify(req.query)}`,
        });
      }
      res.status(200).send({
        message: "Soldiers retrieved successfully",
        data: soldiers,
      })
    }
  )

  server.delete<{ Params: { id: string }; Replay: SoldierOutput }>('/:id',
    {
      schema: {
        params: soldierIdParamSchema,
        response: { 202: soldierDeleteResponseSchema },
      },
    },
    async (req, res) => {
      const deletedSoldier = await deleteSoldier(server, req.params.id)

      if (!deletedSoldier) {
        return res.status(404).send({
          status_code: 404,
          message: `No soldier found with id: ${req.params.id}`,
        });
      }

      res.status(202).send({
        message: "Soldier deleted successfully",
        deleted_soldier: deletedSoldier,
      })
    }
  )

  server.patch<{ Params: { id: string }; Body: UpdatedSoldier; Replay: SoldierOutput }>('/:id',////NO FINISHED, delete option to add extra staff or change id 
    {
      schema: {
        params: soldierIdParamSchema,
        body: updateSoldierSchema,
        response: { 200: soldierResponseSchema },
      },
    },
    async (req, res) => {
      const soldier = await patchSoldier(server, req.params.id, req.body) 

      if (soldier === null) {
        return res.status(404).send({
          status_code: 404,
          message: `No soldier found with the id: ${req.params.id}`,
        });
      } else if (soldier === "Nothing to update") {
         return res.status(400).send({
          status_code: 400,
          message: `Nothing to update`,
        });
      }

      res.status(200).send({
        message: "Soldier patched successfully",
        data: soldier,
      })
    }
  )
}



export default soldierRoutes
