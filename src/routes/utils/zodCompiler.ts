import type { FastifyInstance, FastifySchemaCompiler, FastifySerializerCompiler } from 'fastify'
import type { z } from 'zod'

export const setupZodCompiler = (server: FastifyInstance) => {
  const validatorCompiler: FastifySchemaCompiler<z.ZodTypeAny> = ({ schema }) => {
    return data => {
      const result = schema.safeParse(data)

      if (result.success) {
        return { value: result.data }
      }

      const formatted = result.error.flatten()

      const error: any = new Error('Validation error')
      error.statusCode = 400
      error.error = 'Bad Request'
      error.message = 'Invalid request body'
      error.details = formatted.fieldErrors

      return { error }
    }
  }

  const serializerCompiler: FastifySerializerCompiler<z.ZodTypeAny> = ({ schema }) => {
    return data => {
      const result = schema.safeParse(data)
      if (result.success) {
        return JSON.stringify(result.data)
      }
      throw new Error('Response validation failed')
    }
  }

  server.setValidatorCompiler(validatorCompiler)
  server.setSerializerCompiler(serializerCompiler)
}
