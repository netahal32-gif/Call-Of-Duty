import {
  deleteSchema,
  getByIdSchema,
  getByParamsSchema,
  patchSchema,
  postSchema,
  putConstrainsSchema,
} from '../schemas/duty-schema.js'
import type { AppServer } from '../server.js'
import { createDutyService } from '../services/duty-service.js'

const dutyRoutes = async (server: AppServer) => {
  const dutyService = createDutyService(server)

  server.get('/:id', getByIdSchema, async (req, res) => {
    const duty = await dutyService.getDuty(req.params.id)
    return res.status(200).send({ data: duty, message: 'Duty retrieved successfully' })
  })

  server.get('/', getByParamsSchema, async (req, res) => {
    const duties = await dutyService.getDutiesByParams(req.query)
    res.status(200).send({ data: duties, message: 'Duties retrieved successfully' })
  })

  server.post('/', postSchema, async (req, res) => {
    const duty = await dutyService.insertDuty(req.body)
    const { _id, ...publicDuty } = duty
    return res.status(201).send({ data: publicDuty, message: 'Duty created successfully' })
  })

  server.delete('/:id', deleteSchema, async (req, res) => {
    await dutyService.deleteDuty(req.params.id)
    res.status(204).send()
  })

  server.patch('/:id', patchSchema, async (req, res) => {
    const duty = await dutyService.updateDuty(req.params.id, req.body)

    res.status(200).send({ data: duty!, message: 'Duty updated successfully' })
  })

  server.put('/:id/constraints', putConstrainsSchema, async (req, res) => {
    const duty = await dutyService.addConstraintsToDuty(req.params.id, req.body)
    res.status(200).send({ data: duty, message: 'Duty constraints added successfully' })
  })
}

export default dutyRoutes
