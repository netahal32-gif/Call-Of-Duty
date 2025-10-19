export const loggerErrorHandler = (error: any, req: any, res: any) => {
  req.log.error(error)

  if (error.statusCode === 400) {
    return res.status(400).send({
      details: error.details,
      error: 'Bad Request',
      message: error.message,
    })
  }

  return res.status(error.statusCode || 500).send({
    error: 'Internal Server Error',
    message: error.message || 'Something went wrong',
  })
}
