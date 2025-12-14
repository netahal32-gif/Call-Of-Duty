const isTest = process.env.NODE_ENV === 'test'

export const loggerConfig = {
  level: isTest === true ? 'silent' : 'info',
  transport: {
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:HH:MM:ss Z',
    },
    target: 'pino-pretty',
  },
}
