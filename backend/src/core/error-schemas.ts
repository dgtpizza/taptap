import { Type } from '@sinclair/typebox'

export const apiErrorSchema = Type.Object({
  error: Type.Object({
    code: Type.Union([
      Type.Literal('VALIDATION'),
      Type.Literal('UNAUTHORIZED'),
      Type.Literal('RATE_LIMITED'),
      Type.Literal('INTERNAL'),
    ]),
    message: Type.String(),
  }),
})

export const commonErrorResponses = {
  400: apiErrorSchema,
  401: apiErrorSchema,
  413: apiErrorSchema,
  429: apiErrorSchema,
  500: apiErrorSchema,
}
