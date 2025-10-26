import { z } from 'zod'

export const timestampsSchema = z.object({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const errorResponseSchema = z.object({
  message: z.string(),
})
