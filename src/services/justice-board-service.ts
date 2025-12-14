import { dutyCollection } from '../models/duty-model.js'
import { soldierCollection } from '../models/soldier-model.js'
import type { AppServer } from '../server.js'
import type { SoldierId } from '../types/soldier.js'
import { CustomError, NoSoldierError } from '../utils/error/custom-error.js'

export const createJusticeService = (server: AppServer) => {
  const soldiersCollection = soldierCollection(server)
  const dutiesCollection = dutyCollection(server)

  const getBoard = async () => {
    const result = await soldiersCollection
      .aggregate([
        {
          $lookup: {
            as: 'dutiesCount',
            foreignField: 'soldiers',
            from: 'duties',
            localField: '_id',
          },
        },
        {
          $project: {
            _id: 1,
            score: { $size: '$dutiesCount' },
          },
        },
        { $sort: { score: -1 } },
      ])
      .toArray()
    if (!result.length) throw new CustomError(404, `No soldiers found in the db`)
    return result as { _id: string; score: number }[]
  }

  const getScoreById = async (_id: SoldierId) => {
    const soldierExists = await soldiersCollection.findOne({ _id })
    if (!soldierExists) throw new NoSoldierError(_id)

    const dutyCount = await dutiesCollection.countDocuments({
      soldiers: _id,
    })

    return { _id, score: dutyCount }
  }

  return {
    getBoard,
    getScoreById,
  }
}
