import { Type } from '@sinclair/typebox'
import { commonErrorResponses } from '@/core/error-schemas'

export const leaderboardEntrySchema = Type.Object(
  {
    rank: Type.Integer({ minimum: 1 }),
    telegramId: Type.Integer({ minimum: 1 }),
    firstName: Type.String(),
    lastName: Type.Optional(Type.String()),
    username: Type.Optional(Type.String()),
    clicks: Type.Integer({ minimum: 0 }),
  },
  { additionalProperties: false },
)

export const leaderboardResponseSchema = Type.Object(
  {
    top: Type.Array(leaderboardEntrySchema),
    me: Type.Object(
      {
        rank: Type.Integer({ minimum: 1 }),
        clicks: Type.Integer({ minimum: 0 }),
        telegramId: Type.Integer({ minimum: 1 }),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
)

export const leaderboardRouteSchema = {
  response: {
    200: leaderboardResponseSchema,
    ...commonErrorResponses,
  },
}
