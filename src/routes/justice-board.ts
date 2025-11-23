import { getAllScoresSchema, getByIdSchema } from '../schemas/justice-board.js'
import type { AppServer } from '../server.js'
import { createJusticeService } from '../services/justice-board-service.js'

const justiceRoutes = async (server: AppServer) => {
  const justiceService = createJusticeService(server)

  server.get('/', getAllScoresSchema, async (_, res) => {
    const justice = await justiceService.getBoard()
    if (!justice.length) {
      return res.status(404).send({ message: 'No soldiers found in the db' })
    }
    return res.status(200).send({ data: justice, message: 'Justice board retrieved successfully' })
  })

  server.get('/:_id', getByIdSchema, async (req, res) => {
    const justice = await justiceService.getScoreById(req.params._id)
    if (!justice) {
      return res.status(404).send({
        message: `No soldier found with id ${req.params._id} `,
      })
    }
    return res.status(200).send({ data: justice, message: 'Soldier`s score retrieved successfully' })
  })
}

export default justiceRoutes
