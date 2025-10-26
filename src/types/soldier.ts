import { z } from 'zod'
import { timestampsSchema } from './general.js'

export const ranks = ['private', 'corporal', 'sergeant', 'lieutenant', 'captain', 'major', 'colonel'] as const

export const soldierIdParamSchema = z.object({
  _id: z.string().regex(/^\d{7}$/, 'Must be a 7-digit number string.'),
})

export const soldierLimitationsSchema = z.array(z.string().toLowerCase())

export const rankSchema = z
  .object({
    name: z.enum(ranks).optional(),
    value: z.coerce
      .number()
      .min(0)
      .max(ranks.length - 1)
      .optional(),
  })
  .transform(r => {
    if (r.name && r.value === undefined) return { name: r.name, value: ranks.indexOf(r.name) }
    if (r.value !== undefined && r.name === undefined) return { name: ranks[r.value], value: r.value }
    return r
  })
  .refine(r => r.name !== undefined || r.value !== undefined, {
    message: 'Either rank.name or rank.value is required',
  })
  .refine(r => ranks[r.value!] === r.name, {
    message: 'Rank name and rank value must match',
  })

export const baseSoldierSchema = z.object({
  limitations: soldierLimitationsSchema,
  name: z.string().min(3).max(50),
})

export const soldierSchema = soldierIdParamSchema.extend(baseSoldierSchema.shape).extend({ rank: rankSchema }).strict()

export const soldierOutputSchema = soldierSchema.extend(timestampsSchema.shape)

export const soldierQuerySchema = baseSoldierSchema
  .extend(timestampsSchema.shape)
  .extend({
    rankName: z.enum(ranks),
    rankValue: z.coerce
      .number()
      .min(0)
      .max(ranks.length - 1),
  })
  .partial()
  .strict()

export const SoldierBodyToUpdateSchema = baseSoldierSchema
  .extend({ rank: rankSchema })
  .partial()
  .strict()
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  })

export const soldierAddLimitationsSchema = soldierLimitationsSchema.refine(data => Object.keys(data).length > 0, {
  message: 'At least one limitation must be provided to update',
})

export const soldierResponseSchema = z.object({
  data: soldierOutputSchema,
  message: z.string(),
})

export const soldiersArrayResponseSchema = z.object({
  data: z.array(soldierOutputSchema),
  message: z.string(),
})

export type SoldierBodyToUpdate = z.infer<typeof SoldierBodyToUpdateSchema>

export type SoldierOutput = z.infer<typeof soldierOutputSchema>

export type Soldier = z.infer<typeof soldierSchema>

export type SoldierQuery = z.infer<typeof soldierQuerySchema>

export type SoldierRank = z.infer<typeof rankSchema>
