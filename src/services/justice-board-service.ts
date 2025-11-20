import { dutyCollection } from '../models/duty-model.js'
import { soldierCollection } from '../models/soldier-model.js'
import type { AppServer } from '../server.js'
import type { SoldierId } from '../types/soldier.js'

export const createJusticeService = (server: AppServer) => {
  const soldiersCollection = soldierCollection(server)
  const dutiesCollection = dutyCollection(server)

  const getBoard = async () => {
    const result = await soldiersCollection
      .aggregate([
        {
          $lookup: {
            as: 'duties',
            from: 'duties',
            let: { soldierId: '$_id' },
            pipeline: [{ $match: { $expr: { $in: ['$$soldierId', '$soldiers'] } } }],
          },
        },
        {
          $project: {
            _id: 1,
            score: { $size: '$duties' },
          },
        },
        { $sort: { score: -1 } },
      ])
      .toArray()

    return result as { _id: string; score: number }[]
  }

  const getScoreById = async (_id: SoldierId) => {
    const soldierExists = await soldiersCollection.findOne({ _id })
    if (!soldierExists) return null

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
