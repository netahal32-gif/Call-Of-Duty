import type { BaseDuty } from '../src/types/duty.js'
import type { Soldier } from '../src/types/soldier.js'
import {  defaultSoldierInput } from './data.js'

type SoldierPostBodyOptions = Soldier & {
  blankRank?: boolean
}

export const defaultDutyInput: BaseDuty = {
  constraints: ['No phones', 'Night duty'],
  description: 'Soldiers will secure the main gate during night hours.',
  endTime: new Date('2030-10-10T00:00:00Z'),
  location: [34.7812, 32.0853],
  maxRank: 3,
  minRank: 1,
  name: 'Guard the Main Gate',
  soldiersRequired: 5,
  startTime: new Date('2030-10-01T00:00:00Z'),
  value: 100,
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

export const dutyPostBody = (input: Partial<BaseDuty> = {}) => {
  const merged = { ...defaultDutyInput, ...input }

  return { ...merged }
}
