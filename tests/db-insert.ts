import type { BaseDuty } from '../src/types/duty.js'
import type { Soldier } from '../src/types/soldier.js'
import { buildSoldier } from './data.js'
import { defaultDutyOutput } from './data.js'

export const soldierPostBody = (input: Partial<Soldier> = {}) => {
  const soldier = buildSoldier(input)
  return {
    ...soldier,
  }
}

export const dutyPostBody = (input: Partial<BaseDuty> = {}) => {
  const merged = { ...defaultDutyOutput, ...input }

  return { ...merged }
}
