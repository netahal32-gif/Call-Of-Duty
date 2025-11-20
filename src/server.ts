import fastifyMongo from '@fastify/mongodb'
import type {
  FastifyBaseLogger,
  FastifyInstance,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from 'fastify'
import Fastify from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import dutyRoutes from './routes/duty.js'
import healthRoutes from './routes/health.js'
import justiceRoutes from './routes/justice-board.js'
import soldierRoutes from './routes/soldier.js'
import { loggerConfig } from './utils/logger/logger-config.js'
import { loggerErrorHandler } from './utils/logger/logger-error-handler.js'

const buildServer = async () => {
  const base = Fastify({
    logger: loggerConfig,
  })

  const server = base.withTypeProvider<ZodTypeProvider>()

  const MONGO_URL = process.env.MONGO_URL!
  await server.register(fastifyMongo, { forceClose: true, url: MONGO_URL })

  server.setErrorHandler(loggerErrorHandler)

  server.setValidatorCompiler(validatorCompiler)
  server.setSerializerCompiler(serializerCompiler)

  await server.register(healthRoutes, { prefix: '/health' })
  await server.register(soldierRoutes, { prefix: '/soldiers' })
  await server.register(dutyRoutes, { prefix: '/duties' })
  await server.register(justiceRoutes, { prefix: '/justice-board' })

  return server
}


export type AppServer = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyBaseLogger,
  ZodTypeProvider
>
export default buildServer