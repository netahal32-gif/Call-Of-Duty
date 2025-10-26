
import type { BaseDuty, DutyDB } from '../src/types/duty.js'
import type { Soldier, SoldierDb, SoldierRank } from '../src/types/soldier.js'
import { ranks } from '../src/types/soldier.js'

export const defaultSoldierInput: Soldier = {
  _id: '1000001',
  limitations: ['sunlight', 'running'],
  name: 'John Doe',
  rank: { name: 'major', value: 5 },
}

export const defaultSoldierOutput: SoldierDb = {
  ...defaultSoldierInput,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const normalizeRank = (r: SoldierRank) => {
  if (!r.name && !r.value) {
    return { name: undefined, value: undefined }
  }

  return {
    name: r.name ?? ranks[r.value!],
    value: r.value ?? ranks.indexOf(r.name!),
  }
}

export const soldierPostBody = (input: Partial<Soldier> = {}) => {
  return {
    ...defaultSoldierInput,
    ...input,
    rank: normalizeRank(input.rank ?? defaultSoldierInput.rank),
  }
}

export const soldierDbBody = (input: Partial<SoldierDb> = {}) => {
  return {
    ...defaultSoldierOutput,
    ...input,
    rank: normalizeRank(input.rank ?? defaultSoldierOutput.rank),
  }
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

export const defaultDutyOutput: DutyDB = {
  ...defaultDutyInput,
  createdAt: new Date(),
  soldiers: [],
  status: 'unscheduled',
  statusHistory: [{ date: new Date(), status: 'unscheduled' }],
  updatedAt: new Date(),
}

export const dutyPostBody = (input?: Partial<BaseDuty>) => {
  return {
    ...defaultDutyInput,
    ...input,
  }
}

export const dutyDbBody = (input?: Partial<DutyDB>) => {
  return {
    ...defaultDutyOutput,
    ...input,
  }
}
