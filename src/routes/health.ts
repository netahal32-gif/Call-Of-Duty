import type { AppServer } from '../server.js'

const healthRoutes = async (server: AppServer) => {
  server.get('/', async (_, res) => {
    return res.status(200).send({ status: 'ok' })
  })

  server.get('/db', async (_, res) => {
    try {
      await server.mongo.client.db().command({ ping: 1 })
      return res.status(200).send({ status: 'ok' })
    } catch {
      return res.status(503).send({ status: 'No mongoDB connection' })
    }
  })
}

export default healthRoutes
