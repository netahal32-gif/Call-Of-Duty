import { z } from 'zod'
import { timestampsSchema } from './general.js'
import { ranks } from './soldier.js'

export const mongoIdSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) })

const startBeforeEnd = (data: { startTime: Date; endTime: Date }) => data.startTime < data.endTime

const minRankLessThanMax = (data: { minRank?: number; maxRank?: number }) =>
  data.minRank === undefined || data.maxRank === undefined || data.minRank <= data.maxRank

const startBeforeEndMessage = { message: 'startTime must be before endTime', path: ['startTime'] }
const minRankMessage = { message: 'minRank cannot be greater than maxRank', path: ['minRank'] }

export const time = {
  endTime: z.coerce.date(),
  startTime: z.coerce.date(),
}

export const baseDutySchema = z
  .object({
    constraints: z.array(z.string()),
    description: z.string(),
    endTime: time.endTime.refine(date => date > new Date(), {
      message: 'EndTime must be a future date',
    }),
    location: z.array(z.coerce.number()).min(2).max(3),
    maxRank: z.coerce
      .number()
      .min(0)
      .max(ranks.length - 1)
      .optional(),
    minRank: z.coerce
      .number()
      .min(0)
      .max(ranks.length - 1)
      .optional(),
    name: z.string().min(3).max(50),
    soldiersRequired: z.coerce.number(),
    startTime: time.startTime.refine(date => date > new Date(), {
      message: 'StartTime must be a future date',
    }),
    value: z.coerce.number().positive(),
  })
  .strict()
  .refine(startBeforeEnd, startBeforeEndMessage)
  .refine(minRankLessThanMax, minRankMessage)

export const extrasDutySchema = z.object({
  soldiers: z.array(z.string()).default([]),
  status: z.string().default('unscheduled'),
  statusHistory: z
    .array(
      z.object({
        date: z.coerce.date(),
        status: z.string(),
      }),
    )
    .default(() => [{ date: new Date(), status: 'unscheduled' }]),
})

export const dutySchema = baseDutySchema
  .safeExtend(extrasDutySchema.shape)

export const dutyOutputSchema = baseDutySchema
  .safeExtend(extrasDutySchema.shape)
  .safeExtend(timestampsSchema.shape)
  .strict()
  .refine(startBeforeEnd, startBeforeEndMessage)
  .refine(minRankLessThanMax, minRankMessage)

export const dutyQuerySchema = baseDutySchema
  .safeExtend(timestampsSchema.shape)
  .safeExtend({
    endTime: time.endTime,
    soldiers: z.array(z.string()),
    startTime: time.startTime,
    status: z.string(),
  })
  .strict()
  .partial()

export const updateDutySchema = baseDutySchema
  .safeExtend({
    soldiers: z.array(z.string()),
    status: z.string(),
  })
  .strict()
  .partial()
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  })

export const constraintsSchema = z.array(z.string()).refine(data => Object.keys(data).length > 0, {
  message: 'At least one constrain must be provided to update',
})

export const dutyResponseSchema = z.object({
  data: dutyOutputSchema,
  message: z.string(),
})

export const dutiesArrayResponseSchema = z.object({
  data: z.array(dutyOutputSchema),
  message: z.string(),
})

export type BaseDuty = z.infer<typeof baseDutySchema>

export type Duty = z.infer<typeof dutySchema>

export type DutyOutput = z.infer<typeof dutyOutputSchema>

export type DutyQuery = z.infer<typeof dutyQuerySchema>

export type UpdateDuty = z.infer<typeof updateDutySchema>
