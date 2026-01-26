import { Request, Response, NextFunction } from 'express'

export interface CustomError extends Error {
  statusCode?: number
  status?: number
}

export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction // ← Este parámetro es OBLIGATORIO aunque no lo uses
) => {
  const statusCode = err.statusCode || err.status || 500
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
