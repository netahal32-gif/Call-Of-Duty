import type { AppServer } from './server.js'
import buildServer from './server.js'

const PORT = Number(process.env.PORT)
let server: AppServer

const start = async () => {
  try {
    server = await buildServer()
    await server.listen({ port: PORT })
  } catch (err) {
    if (server) {
      server.log.fatal(err, 'Error Listening to Server')
    } else {
      console.error('Error starting server (server not initialized):', err)
    }
    process.exitCode = 1
  }
}

start()
