import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import type { ClicksRequest, ClicksResponse, MeResponse } from '@shared/contract'
import { createClickerHandlers } from '@/modules/clicker/handlers'
import { clicksRouteSchema, meRouteSchema } from '@/modules/clicker/schemas'

export const clickerRoutes: FastifyPluginAsyncTypebox = async (app) => {
  const handlers = createClickerHandlers(app)

  // Only this route accepts a body; cap it tight to block oversized-payload abuse.
  app.post<{ Body: ClicksRequest; Reply: ClicksResponse }>(
    '/clicks',
    { schema: clicksRouteSchema, bodyLimit: app.config.BODY_LIMIT_BYTES },
    handlers.postClicks,
  )

  app.get<{ Reply: MeResponse }>('/me', { schema: meRouteSchema }, handlers.getMe)
}
