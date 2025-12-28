import { getAllScoresSchema, getByIdSchema } from '../schemas/justice-board.js'
import type { AppServer } from '../server.js'
import { createJusticeService } from '../services/justice-board-service.js'

const justiceRoutes = async (server: AppServer) => {
  const justiceService = createJusticeService(server)

  server.get('/', getAllScoresSchema, async (_, res) => {
    const justiceScoreArray = await justiceService.getBoard()
    return res.status(200).send({ data: justiceScoreArray, message: 'Justice board retrieved successfully' })
  })

  server.get('/:_id', getByIdSchema, async (req, res) => {
    const justiceScoreArray = await justiceService.getScoreById(req.params._id)
    return res.status(200).send({ data: justiceScoreArray, message: 'Soldier`s score retrieved successfully' })
  })
}

export default justiceRoutes
