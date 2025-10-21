import { z } from 'zod'

const ranks = ['private', 'corporal', 'sergeant', 'lieutenant', 'captain', 'major', 'colonel'] as const

export const soldierIdParamSchema = z.object({
  id: z.string().regex(/^\d{7}$/, "Must be a 7-digit number string."),
});

export const soldierLimitationsSchema = z
  .array(z.string())
  .transform(arr => arr.map(limit => limit.toLowerCase()))


const rankSchema = z.object({
  name: z.enum(ranks).optional(),
  value: z
    .coerce
    .number()
    .refine(v => v >= 0 && v <= 6, 'Value must be between 0 and 6')
    .optional(),
}).transform(r => {
  if (r.name && r.value === undefined) return { name: r.name, value: ranks.indexOf(r.name) }
  if (r.value !== undefined && r.name === undefined) return { name: ranks[r.value], value: r.value }
  return r
})
  .refine(r => r.name !== undefined || r.value !== undefined, {
    message: 'Either rank.name or rank.value is required',
  })
  .refine(r => r.value === undefined || r.name === undefined || ranks[r.value] === r.name, {
    message: 'Rank name and rank value must match',
  })

const timestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const baseSoldierSchema = z.object({
  name: z.string().min(3).max(50),
  rank: rankSchema,
  limitations: soldierLimitationsSchema
})

export const soldierSchema = soldierIdParamSchema.merge(baseSoldierSchema);

export const soldierOutputSchema = soldierSchema.merge(timestampsSchema)

export const soldierResponseSchema = z.object({
  message: z.string(),
  data: soldierOutputSchema,
})

export const multiSoldierResponseSchema = z.object({
  message: z.string(),
  data: z.array(soldierOutputSchema),
})

export const soldierQuerySchema = z.object({
  name: z.string().optional(),
  limitations: z
    .string()
    .transform(str => str.split(',').map(s => s.toLowerCase()))
    .optional(),
  rank_name: z.string().optional(),
  rank_value: z.coerce.number().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
})

export const updateSoldierSchema =
  baseSoldierSchema
    .partial()
    .strict()
    .refine(data => Object.keys(data).length > 0, {
      message: "At least one field must be provided to update",
    });

export type UpdatedSoldier = z.infer<typeof updateSoldierSchema>

export type SoldierOutput = z.infer<typeof soldierOutputSchema>

export type Soldier = z.infer<typeof soldierSchema>

export type SoldierQuery = z.infer<typeof soldierQuerySchema>

export type Limitations = z.infer<typeof soldierLimitationsSchema>
