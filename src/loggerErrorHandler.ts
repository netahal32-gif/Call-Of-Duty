import { ZodError } from 'zod'

export const loggerErrorHandler = (error: any, req: any, res: any) => {
  req.log.error(error)

  if ((error instanceof ZodError) ||
    (error.cause && error.cause instanceof ZodError)) {
    const zodErr: ZodError =
      error instanceof ZodError
        ? error
        : error.cause 

    const details = zodErr.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))


    return res.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid request body',
      details,
    })
  }

  if (error.validation) {
    return res.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: error.message,
      details: error.validation,
    })
  }

  res.status(error.statusCode || 500).send({
    statusCode: error.statusCode || 500,
    error: error.name || 'Internal Server Error',
    message: error.message,
  })
}
