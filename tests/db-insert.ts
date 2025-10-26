import type { Soldier } from '../src/types/soldier.js'
import { defaultSoldierInput } from './data.js'

type SoldierPostBodyOptions = Soldier & {
  blankRank?: boolean
}
export const soldierPostBody = (input: Partial<SoldierPostBodyOptions> = {}) => {
  const { _id, limitations, name, rank, blankRank } = { ...defaultSoldierInput, ...input }

  return {
    _id,
    limitations,
    name,
    rank: blankRank
      ? {}
      : {
          name: rank.name,
          value: rank.value,
        },
  }
}
