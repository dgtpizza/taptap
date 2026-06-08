import mongoose, { Schema, type Connection, type Model } from 'mongoose'

mongoose.set('strictQuery', true)

export type UserDoc = {
  _id: number
  username?: string
  firstName: string
  lastName?: string
  clicks: number
  energy: number
  energyAt: Date
  lastAccepted?: number
  recentNonces?: string[]
  createdAt: Date
  lastVisitedAt: Date
}
export type UserModel = Model<UserDoc>

// One window doc per key. The unique _id makes concurrent passes across instances
// collide; the TTL index on expireAt garbage-collects spent windows.
export type RateLimitDoc = { _id: string; expireAt: Date }
export type RateLimitModel = Model<RateLimitDoc>

const userSchema = new Schema<UserDoc>(
  {
    _id: Number,
    username: String,
    firstName: { type: String, required: true },
    lastName: String,
    clicks: { type: Number, default: 0 },
    energy: { type: Number, default: 0 },
    energyAt: { type: Date, default: Date.now },
    lastAccepted: Number,
    recentNonces: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    lastVisitedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
)
userSchema.index({ clicks: -1, _id: 1 })

const rateLimitSchema = new Schema<RateLimitDoc>(
  { _id: String, expireAt: { type: Date, required: true } },
  { versionKey: false },
)
rateLimitSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

export type DbHandle = {
  connection: Connection
  User: UserModel
  RateLimit: RateLimitModel
}

export type DbPoolOptions = {
  maxPoolSize?: number
  minPoolSize?: number
  serverSelectionTimeoutMS?: number
  socketTimeoutMS?: number
}

export async function connectDb(uri: string, dbName: string, pool: DbPoolOptions = {}): Promise<DbHandle> {
  const connection = await mongoose.createConnection(uri, { dbName, autoIndex: false, ...pool }).asPromise()
  const User = connection.model<UserDoc>('User', userSchema)
  const RateLimit = connection.model<RateLimitDoc>('RateLimit', rateLimitSchema)
  await Promise.all([User.createIndexes(), RateLimit.createIndexes()])
  return { connection, User, RateLimit }
}
