import { z } from 'zod'
import { soldierIdSchema } from './soldier.js'

export const justiceBoardDbSchema = z.object({
  _id: soldierIdSchema,
  score: z.number(),
})

export const justiceBoardResponseSchema = z.object({
  data: justiceBoardDbSchema,
  message: z.string(),
})

export const justiceBoardArrayResponseSchema = z.object({
  data: z.array(justiceBoardDbSchema),
  message: z.string(),
})

export type JusticeBoardDb = z.infer<typeof justiceBoardDbSchema>
