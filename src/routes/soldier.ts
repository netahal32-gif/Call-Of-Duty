import {
  deleteSchema,
  getByIdSchema,
  getByParamsSchema,
  patchSchema,
  postSchema,
  putLimitationsSchema,
} from '../schemas/soldier-schemas.js'
import type { AppServer } from '../server.js'
import { createSoldierService } from '../services/soldier-service.js'

const soldierRoutes = async (server: AppServer) => {
  const soldierService = createSoldierService(server)

  server.get('/:_id', getByIdSchema, async (req, res) => {
    const soldier = await soldierService.getSoldierById(req.params._id)
    res.status(200).send({ data: soldier, message: 'Soldier retrieved successfully' })
  })

  server.get('/', getByParamsSchema, async (req, res) => {
    const soldiers = await soldierService.getSoldierByParams(req.query)
    res.status(200).send({ data: soldiers, message: 'Soldiers retrieved successfully' })
  })

  server.post('/', postSchema, async (req, res) => {
    const soldier = await soldierService.insertSoldier(req.body)
    res.status(201).send({ data: soldier, message: 'Soldier created successfully' })
  })

  server.patch('/:_id', patchSchema, async (req, res) => {
    const soldier = await soldierService.updateSoldier(req.params._id, req.body)
    res.status(200).send({ data: soldier, message: 'Soldier updated successfully' })
  })

  server.delete('/:_id', deleteSchema, async (req, res) => {
    await soldierService.deleteSoldier(req.params._id)
    res.status(204).send()
  })

  server.put('/:_id/limitations', putLimitationsSchema, async (req, res) => {
    const soldier = await soldierService.addLimitationsToSoldiers(req.params._id, req.body)
    res.status(200).send({ data: soldier, message: 'Soldier limitations added successfully' })
  })
}

export default soldierRoutes