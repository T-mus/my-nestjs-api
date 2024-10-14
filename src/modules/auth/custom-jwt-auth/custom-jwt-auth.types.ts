import { Types } from 'mongoose'

export type AuthTokens = { accessToken: string; refreshToken: string }

export type TokenPayload = { _id: Types.ObjectId; email: string; roles: string[] }

export type DeviceIdConfig = { value: string; isNew: boolean }
