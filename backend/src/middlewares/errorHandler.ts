import { Request, Response } from 'express'

interface CustomError extends Error {
  statusCode?: number
}

export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response
) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  console.error(`[Error] ${statusCode}: ${message}`)
  console.error(err.stack)

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
