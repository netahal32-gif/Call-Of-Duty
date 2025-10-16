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
import soldierRoutes from "./routes/soldier.js";

const MONGO_URL = String(process.env.MONGO_URL)

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