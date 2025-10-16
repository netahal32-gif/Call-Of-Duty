const isTest = process.env.TEST

export const loggetConfig = {
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
