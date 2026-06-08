import type { UserDoc, UserModel } from '@/core/db'

export type TopEntry = Pick<UserDoc, '_id' | 'firstName' | 'lastName' | 'username' | 'clicks'>

export async function topClickers(User: UserModel, limit: number): Promise<TopEntry[]> {
  return User.find({}, { firstName: 1, lastName: 1, username: 1, clicks: 1 })
    .sort({ clicks: -1, _id: 1 })
    .limit(limit)
    .lean<TopEntry[]>()
}

// Competition rank from the task: equal scores share the same place.
export async function rankOf(User: UserModel, clicks: number): Promise<number> {
  const ahead = await User.countDocuments({ clicks: { $gt: clicks } })
  return ahead + 1
}
