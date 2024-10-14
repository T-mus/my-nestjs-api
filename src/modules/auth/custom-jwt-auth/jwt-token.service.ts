import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { JwtRefreshToken } from './jwt-refresh-token.schema'
import { Model, Types } from 'mongoose'
import { TokenPayload } from './custom-jwt-auth.types'
import { UserRole } from '../../user-roles/user-roles.schema'
import { User } from '../../users/users.schema'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class JwtTokenService {
    constructor(
        @InjectModel(JwtRefreshToken.name) private jwtRefreshTokenModel: Model<JwtRefreshToken>,
        private configService: ConfigService,
        private jwtService: JwtService,
    ) {}

    // prettier-ignore
    async generateTokens(user: User & { roles: UserRole[] }) {
        const payload: TokenPayload = {
            _id: user._id,
            email: user.email,
            roles: user.roles.map((role: UserRole) => role.value),
        }
        const accessTokenExp = this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION', '30m')
        const refreshTokenExp = this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION', '30d')

        const accessToken = this.jwtService.sign(payload, { expiresIn: accessTokenExp })
        const refreshToken = this.jwtService.sign(payload, { expiresIn: refreshTokenExp })

        return { accessToken, refreshToken }
    }

    async saveRefreshToken(userId: Types.ObjectId, refreshToken: string, deviceId: string) {
        const existingToken = await this.jwtRefreshTokenModel.findOne({ userId, deviceId }).exec()
        if (existingToken) {
            existingToken.refreshToken = refreshToken
            await existingToken.save()

            return
        }
        await this.jwtRefreshTokenModel.create({ userId, refreshToken, deviceId })
    }

    async deleteRefreshToken(refreshToken: string) {
        return this.jwtRefreshTokenModel.deleteOne({ refreshToken: refreshToken }).exec()
    }

    async deleteAllRefreshTokens(userId: Types.ObjectId) {
        return this.jwtRefreshTokenModel.deleteMany({ userId: new Types.ObjectId(userId) }).exec()
    }

    async verifyToken(token: string): Promise<TokenPayload> | null {
        try {
            return await this.jwtService.verifyAsync<TokenPayload>(token)
        } catch (err) {
            return null
        }
    }
}
