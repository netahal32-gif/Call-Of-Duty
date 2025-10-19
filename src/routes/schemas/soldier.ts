import { z } from 'zod'

const ranks = ['private', 'corporal', 'sergeant', 'lieutenant', 'captain', 'major', 'colonel'] as const

const timestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const soldierSchema = z.object({
  _id: z.string().regex(/^\d{7}$/, 'Must be a 7-digit number string.'),
  limitations: z
    .array(z.string())
    .transform(arr => arr.map(limit => limit.toLowerCase()))
    .default([]),
  name: z.string().min(3).max(50),
  rank: z
    .object({
      name: z.enum(ranks).optional(),
      value: z
        .number()
        .refine(v => v >= 0 && v <= 6, 'Value must be between 0 and 6')
        .optional(),
    })
    .refine(r => r.name || r.value, { message: 'Either rank.name or rank.value is required' })
    .refine(r => r.value === undefined || r.name === undefined || ranks[r.value] === r.name, {
      message: 'Rank name and rank value must match',
    })
    .transform(r => {
      if (r.name && r.value === undefined) return { name: r.name, value: ranks.indexOf(r.name) }
      if (r.value && r.name === undefined) return { name: ranks[r.value], value: r.value }
      return r
    }),
})

export const soldierOutputSchema = soldierSchema.merge(timestampsSchema)

export const responseSchema = z.object({
  data: soldierOutputSchema,
  message: z.string(),
})

export type SoldierOutput = z.infer<typeof soldierOutputSchema>

export type Soldier = z.infer<typeof soldierSchema>
