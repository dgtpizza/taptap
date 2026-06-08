import type { FastifyInstance, FastifyRequest } from 'fastify'
import { ENERGY_MAX, REGEN_PER_SEC } from '@shared/constants'
import type { ClicksRequest, ClicksResponse, MeResponse } from '@shared/contract'
import type { UserDoc } from '@/core/db'
import { unauthorized } from '@/core/errors'
import { createRateLimiter } from '@/core/rate-limit'
import { applyClicks, currentEnergy, hasRecentNonce } from '@/modules/clicker/service'

type ClicksRequestContext = FastifyRequest<{ Body: ClicksRequest }>

export function createClickerHandlers(app: FastifyInstance) {
  const clickLimiter = createRateLimiter(app.db.RateLimit, app.config.CLICK_RATE_LIMIT_MS)

  return {
    postClicks: async (req: ClicksRequestContext): Promise<ClicksResponse> => {
      const replay = await hasRecentNonce(app.db.User, req.user.telegramId, req.body.nonce)
      if (!replay) await clickLimiter.assertAllowed(`clicks:${req.user.telegramId}`)
      const doc = await applyClicks(app.db.User, req.user.telegramId, req.body.count, req.body.nonce)
      return {
        clicks: doc.clicks,
        energy: doc.energy,
        energyMax: ENERGY_MAX,
        regenPerSec: REGEN_PER_SEC,
        accepted: doc.lastAccepted ?? 0,
      }
    },

    getMe: async (req: FastifyRequest): Promise<MeResponse> => {
      const me = await app.db.User.findOne({ _id: req.user.telegramId }).lean<UserDoc | null>()
      if (!me) throw unauthorized('User not found')

      return {
        telegramId: me._id,
        firstName: me.firstName,
        clicks: me.clicks,
        energy: currentEnergy(me, new Date()),
        energyMax: ENERGY_MAX,
        regenPerSec: REGEN_PER_SEC,
      }
    },
  }
}
