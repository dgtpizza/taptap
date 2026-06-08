export type ErrorCode = 'VALIDATION' | 'UNAUTHORIZED' | 'RATE_LIMITED' | 'INTERNAL'

export type ApiError = { error: { code: ErrorCode; message: string } }
