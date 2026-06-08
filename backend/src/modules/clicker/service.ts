import { ENERGY_MAX, RECENT_NONCE_LIMIT, REGEN_PER_SEC } from '@shared/constants'
import { regeneratedEnergy } from '@shared/energy'
import type { UserDoc, UserModel } from '@/core/db'
import { unauthorized } from '@/core/errors'

export async function hasRecentNonce(User: UserModel, telegramId: number, nonce: string): Promise<boolean> {
  const hit = await User.exists({ _id: telegramId, recentNonces: nonce })
  return hit !== null
}

// One pipeline update keeps regeneration, clamping and click increment atomic for a user.
// A retried batch carrying a recent nonce is a no-op, so a lost response cannot double-count.
export async function applyClicks(
  User: UserModel,
  telegramId: number,
  count: number,
  nonce: string,
): Promise<UserDoc> {
  const doc = await User.findOneAndUpdate(
    { _id: telegramId },
    [
      {
        $set: {
          // Regenerate energy (ignoring negative elapsed time on backwards clocks). A replayed nonce
          // must leave state untouched, so it skips regen and keeps energyAt as well.
          energy: {
            $cond: [
              { $in: [nonce, { $ifNull: ['$recentNonces', []] }] },
              '$energy',
              {
                $min: [
                  ENERGY_MAX,
                  {
                    $add: [
                      '$energy',
                      {
                        $multiply: [
                          REGEN_PER_SEC,
                          {
                            $max: [
                              0,
                              { $floor: { $divide: [{ $subtract: ['$$NOW', '$energyAt'] }, 1000] } },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $set: {
          lastAccepted: {
            $cond: [{ $in: [nonce, { $ifNull: ['$recentNonces', []] }] }, 0, { $min: [count, '$energy'] }],
          },
        },
      },
      {
        $set: {
          clicks: { $add: ['$clicks', '$lastAccepted'] },
          energy: { $subtract: ['$energy', '$lastAccepted'] },
          // Empty-energy spam should not keep moving the regeneration timestamp forward.
          energyAt: { $cond: [{ $gt: ['$lastAccepted', 0] }, '$$NOW', '$energyAt'] },
          recentNonces: {
            $cond: [
              { $in: [nonce, { $ifNull: ['$recentNonces', []] }] },
              '$recentNonces',
              { $slice: [{ $concatArrays: [[nonce], { $ifNull: ['$recentNonces', []] }] }, RECENT_NONCE_LIMIT] },
            ],
          },
        },
      },
    ],
    { new: true },
  ).lean<UserDoc | null>()

  if (!doc) throw unauthorized('User not found')
  return doc
}

export function regenEnergy(energy: number, energyAt: Date, now: Date): number {
  return regeneratedEnergy(
    { energy, energyMax: ENERGY_MAX, regenPerSec: REGEN_PER_SEC, at: energyAt.getTime() },
    now.getTime(),
  )
}

export function currentEnergy(doc: UserDoc, now: Date): number {
  return regenEnergy(doc.energy, doc.energyAt, now)
}
