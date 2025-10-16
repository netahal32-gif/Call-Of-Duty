import fastifyMongo from '@fastify/mongodb'
import Fastify from 'fastify'
import { loggerConfig } from './loggerConfig.js'
import healthRoutes from './routes/health.js'
import soldierRoutes from "./routes/soldier.js";

const MONGO_URL = String(process.env.MONGO_URL)

const buildServer = async () => {
  const server = Fastify({
    logger: loggerConfig,
  })
  await server.register(fastifyMongo, { forceClose: true, url: MONGO_URL })

  await server.register(healthRoutes, { prefix: '/health' })
  await server.register(soldierRoutes, { prefix: "/soldiers" });

  return server
}


export default buildServer
