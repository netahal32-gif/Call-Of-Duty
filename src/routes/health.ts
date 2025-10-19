import type { FastifyInstance } from 'fastify'

const healthRoutes = async (server: FastifyInstance) => {
  server.get('/', async (_, res) => {
    return res.status(200).send({ status: 'ok' })
  })

  server.get('/db', async (_, res) => {
    if (server.mongo?.db) {
      return res.status(200).send({ status: 'ok' })
    } else {
      return res.status(503).send({ status: 'No mongoDB connection' })
    }
  })
}

export default healthRoutes
