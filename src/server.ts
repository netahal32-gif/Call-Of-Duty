import fastifyMongo from '@fastify/mongodb'
import Fastify from 'fastify'
import { loggetConfig } from './loggerConfig.js'
import healthRoutes from './routes/health.js'

const MONGOURL = String(process.env.MONGOURL)

const buildServer = async () => {
  const server = Fastify({
    logger: loggetConfig,
  })
  await server.register(fastifyMongo, { forceClose: true, url: MONGOURL })

  await server.register(healthRoutes, { prefix: '/health' })

  return server
}

export default buildServer
