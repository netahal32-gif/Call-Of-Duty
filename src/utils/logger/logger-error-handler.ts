import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

export const loggerErrorHandler = (error: FastifyError, req: FastifyRequest, res: FastifyReply) => {
  req.log.error(error)

  if (error instanceof z.ZodError) {
    const pretty = z.prettifyError(error)
    return res.status(400).send({
      error: 'Validation Error',
      message: pretty,
    })
  }

  const fallbackZodError = new z.ZodError([
    {
      code: 'custom',
      message: error.message || 'An unexpected error occurred',
      path: [],
    },
  ])

  const pretty = z.prettifyError(fallbackZodError)

  res.status(error.statusCode || 500).send({
    error: error.name || 'Internal Server Error',
    message: pretty,
  })
}
