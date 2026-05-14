import type { Request, Response, NextFunction } from 'express'

const getAllowedKeys = (): string[] => {
  const raw = process.env.API_KEYS ?? ''
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    next()
    return
  }

  const apiKey = req.header('x-api-key')
  const allowed = getAllowedKeys()

  if (!apiKey || !allowed.includes(apiKey)) {
    res.status(401).json({ error: 'x-api-key ausente ou invalida.' })
    return
  }

  next()
}
