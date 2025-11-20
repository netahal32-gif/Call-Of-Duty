import { z } from 'zod'
import { soldierIdSchema } from './soldier.js'

export const justiceOutputSchema = z.object({
  _id: soldierIdSchema,
  score: z.number(),
})

export const justiceResponseSchema = z.object({
  data: justiceOutputSchema,
  message: z.string(),
})

export const justiceArrayResponseSchema = z.object({
  data: z.array(justiceOutputSchema),
  message: z.string(),
})
