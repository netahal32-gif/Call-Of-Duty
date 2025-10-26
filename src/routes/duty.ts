import type { FastifyInstance } from 'fastify'
import { baseDutySchema, dutySchema, dutyResponseSchema } from './schemas/duty.js';
import type { baseDuty } from './schemas/duty.js';
import { postDuty } from './utils/dutyHelpers.js';

const dutyRoutes = async (server: FastifyInstance) => {
  server.post<{ Body: baseDuty; }>(
    "/",
    {
      schema: {
        body: baseDutySchema,
        response: { 201: dutyResponseSchema },
      },
    },
    async (req, res) => {
      const duty = await postDuty(server, req.body)
      res.status(201).send({
        data: duty,
        message: 'Duty added successfully',
      })
    }
  )
}


export default dutyRoutes;