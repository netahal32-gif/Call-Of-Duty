import { z } from 'zod'
import { timestampsSchema } from './general.js'
import { soldierIdSchema, valueSchema } from './soldier.js'

export const mongoIdSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) })

export const baseDutySchema = z
  .object({
    constraints: z.array(z.string()),
    description: z.string(),
    endTime: z.coerce.date().refine(date => date > new Date(), {
      message: 'EndTime must be a future date',
    }),
    location: z.array(z.coerce.number()).min(2).max(3),
    maxRank: valueSchema,
    minRank: valueSchema,
    name: z.string().min(3).max(50),
    soldiersRequired: z.coerce.number().min(0),
    startTime: z.coerce.date().refine(date => date > new Date(), {
      message: 'StartTime must be a future date',
    }),
    value: z.coerce.number().positive(),
  })
  .strict()
  .refine(
    ({ startTime, endTime }: { startTime: Date; endTime: Date }) => startTime < endTime,
    'startTime must be before endTime',
  )
  .refine(
    ({ minRank, maxRank }: { minRank?: number; maxRank?: number }) => minRank! <= maxRank!,
    'minRank cannot be greater than maxRank',
  )

export const soldiersAndStatusSchema = {
  soldiers: z.array(soldierIdSchema),
  status: z.string(),
}

export const extrasDutySchema = z.object({
  soldiers: soldiersAndStatusSchema.soldiers.default([]),
  status: soldiersAndStatusSchema.status.default('unscheduled'),
  statusHistory: z
    .array(
      z.object({
        date: z.coerce.date(),
        status: z.string(),
      }),
    )
    .default(() => [{ date: new Date(), status: 'unscheduled' }]),
})

export const dutySchema = baseDutySchema.safeExtend(extrasDutySchema.shape)

export const dutyOutputSchema = dutySchema.safeExtend(timestampsSchema.shape).strict()

export const dutyQuerySchema = baseDutySchema
  .safeExtend(timestampsSchema.shape)
  .safeExtend(soldiersAndStatusSchema)
  .omit({ constraints: true })
  .safeExtend({
    constraints: z.preprocess(val => (Array.isArray(val) ? val : [val]), z.array(z.string())),
    endTime: z.coerce.date(`Could not coerce value into a valid Date`),
    startTime: z.coerce.date(`Could not coerce value into a valid Date`),
  })
  .strict()
  .partial()

export const updateDutySchema = baseDutySchema
  .safeExtend(soldiersAndStatusSchema)
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

export type DutyDB = z.infer<typeof dutyOutputSchema>

export type DutyQuery = z.infer<typeof dutyQuerySchema>

export type UpdateDuty = z.infer<typeof updateDutySchema>