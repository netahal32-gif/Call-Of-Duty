import { z } from 'zod'
import { soldierIdSchema } from './soldier.js'

export const justiceBoardSchema = z.object({
  _id: soldierIdSchema,
  score: z.number(),
})

export const justiceBoardResponseSchema = z.object({
  data: justiceBoardSchema,
  message: z.string(),
})

export const justiceBoardArrayResponseSchema = z.object({
  data: z.array(justiceBoardSchema),
  message: z.string(),
})

export type JusticeBoard = z.infer<typeof justiceBoardSchema>
