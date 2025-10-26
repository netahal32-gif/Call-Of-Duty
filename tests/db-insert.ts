import type { Soldier } from '../src/types/soldier.js'
import { buildSoldier } from './data.js'

export const soldierPostBody = (input: Partial<Soldier> = {}) => {
  const soldier = buildSoldier(input)
  return {
    ...soldier,
  }
}
