import { Type } from '@sinclair/typebox'
import { MAX_BATCH } from '@shared/constants'
import { commonErrorResponses } from '@/core/error-schemas'

export const clicksBodySchema = Type.Object(
  {
    count: Type.Integer({ minimum: 1, maximum: MAX_BATCH }),
    nonce: Type.String({ minLength: 1, maxLength: 64 }),
  },
  { additionalProperties: false },
)

export const clicksResponseSchema = Type.Object(
  {
    clicks: Type.Integer({ minimum: 0 }),
    energy: Type.Integer({ minimum: 0 }),
    energyMax: Type.Integer({ minimum: 1 }),
    regenPerSec: Type.Integer({ minimum: 0 }),
    accepted: Type.Integer({ minimum: 0 }),
  },
  { additionalProperties: false },
)

export const meResponseSchema = Type.Object(
  {
    telegramId: Type.Integer({ minimum: 1 }),
    firstName: Type.String(),
    clicks: Type.Integer({ minimum: 0 }),
    energy: Type.Integer({ minimum: 0 }),
    energyMax: Type.Integer({ minimum: 1 }),
    regenPerSec: Type.Integer({ minimum: 0 }),
  },
  { additionalProperties: false },
)

export const clicksRouteSchema = {
  body: clicksBodySchema,
  response: {
    200: clicksResponseSchema,
    ...commonErrorResponses,
  },
}

export const meRouteSchema = {
  response: {
    200: meResponseSchema,
    ...commonErrorResponses,
  },
}
