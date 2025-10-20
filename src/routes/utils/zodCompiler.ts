import type { FastifyInstance, FastifySchemaCompiler, FastifySerializerCompiler } from 'fastify'
import type { z } from 'zod'

const zodError = (error: z.ZodError) => {
  const formatted = error.flatten()
  const err: any = new Error('Validation error')
  err.statusCode = 400
  err.error = 'Bad Request'
  err.message = 'Invalid request body'
  err.details = formatted.fieldErrors
  return { error: err }
}


export const setupZodCompiler = (server: FastifyInstance) => {
  const normalize = (obj: any) =>
    obj && typeof obj === "object"
      ? JSON.parse(JSON.stringify(obj))
      : obj;

  const validatorCompiler: FastifySchemaCompiler<z.ZodTypeAny> = ({ schema }) => {
    return data => {
      const normalized = normalize(data);
      const result = schema.safeParse(normalized)

      if (result.success) {
        return { value: result.data }
      }
      return zodError(result.error)
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
