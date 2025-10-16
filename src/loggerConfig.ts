const isTest = process.env.TEST

export const loggerConfig = {
  level: isTest === 'true' ? 'silent' : 'info',
  transport: {
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:HH:MM:ss Z',
    },
    target: 'pino-pretty',
  },
}
