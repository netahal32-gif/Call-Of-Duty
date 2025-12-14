import { soldierCollection } from '../models/soldier-model.js'
import type { AppServer } from '../server.js'
import type { JusticeBoardDb } from '../types/justice-board.js'
import type { SoldierId } from '../types/soldier.js'
import { CustomError, NoSoldierError } from '../utils/error/custom-error.js'

export const createJusticeService = (server: AppServer) => {
  const soldiersCollection = soldierCollection(server)

  const dutiesValueCalculator = [
    {
      $lookup: {
        as: 'assignedDuties',
        foreignField: 'soldiers',
        from: 'duties',
        localField: '_id',
      },
    },
    {
      $project: {
        _id: 1,
        score: {
          $sum: '$assignedDuties.value',
        },
      },
    },
  ]

  const getBoard = async () => {
    const result = await soldiersCollection.aggregate([...dutiesValueCalculator]).toArray()
    if (!result.length) throw new CustomError(404, `No soldiers found in the db`)
    return result as JusticeBoardDb[]
  }

  const getScoreById = async (_id: SoldierId) => {
    const soldierExists = await soldiersCollection.findOne({ _id })
    if (!soldierExists) throw new NoSoldierError(_id)

    const dutyCount = await soldiersCollection.aggregate([{ $match: { _id } }, ...dutiesValueCalculator]).toArray()

    return dutyCount[0] as JusticeBoardDb
  }

  return {
    getBoard,
    getScoreById,
  }
}
