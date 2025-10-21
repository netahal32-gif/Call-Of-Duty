import type { FastifyInstance, FastifySchemaCompiler, FastifySerializerCompiler } from 'fastify'
import type { z } from 'zod'

export const setupZodCompiler = (server: FastifyInstance) => {
  const validatorCompiler: FastifySchemaCompiler<z.ZodTypeAny> = ({ schema }) => {
    return data => {
      const result = schema.safeParse(data)

      if (result.success) {
        return { value: result.data }
      }
      return { error: result.error }
    }
  }

  const serializerCompiler: FastifySerializerCompiler<z.ZodTypeAny> = ({ schema }) => {
    return data => {
      const result = schema.safeParse(data)
      if (result.success) {
        return JSON.stringify(result.data)
      }
      throw new Error('Response validation failed: ' + JSON.stringify(result.error.issues))
    }
  }

  server.setValidatorCompiler(validatorCompiler)
  server.setSerializerCompiler(serializerCompiler)
}
