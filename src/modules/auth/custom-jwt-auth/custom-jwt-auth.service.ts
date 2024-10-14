import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { CreateUserDto } from '../../users/dtos/create-user.dto'
import { UsersService } from '../../users/users.service'
import { hash, compare } from 'bcryptjs'
import { Model } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'
import { JwtRefreshToken } from './jwt-refresh-token.schema'
import {
    ALREADY_EXISTS_ERROR,
    INVALID_ACCOUNT_ACTIVATION_TOKEN_ERROR,
    INVALID_TOKEN_ERROR,
    MISSING_REFRESH_PARAMS_ERROR,
    NO_USER_FOUND_ERROR,
    UNAUTHORIZED_ERROR_MSG,
    WRONG_PASSWORD_ERROR,
} from './custom.jwt-auth.constants'
import { AuthTokens, DeviceIdConfig } from './custom-jwt-auth.types'
import { JwtTokenService } from './jwt-token.service'
import { SendGridService } from '../../send-grid/send-grid.service'
import * as uuid from 'uuid'
import * as path from 'path'
import { ConfigService } from '@nestjs/config'
import { randomBytes } from 'crypto'
import { SmsService } from '../../sms/sms.service'

@Injectable()
export class CustomJwtAuthService {
    private viewsPath: string

    constructor(
        @InjectModel(JwtRefreshToken.name) private jwtRefreshTokenModel: Model<JwtRefreshToken>,
        private usersService: UsersService,
        private jwtTokenService: JwtTokenService,
        private sendGridService: SendGridService,
        private configService: ConfigService,
        private smsService: SmsService,
    ) {
        this.viewsPath = path.resolve(__dirname, '..', '..', '..', 'common', 'views')
    }

    // prettier-ignore
    async register(dto: CreateUserDto): Promise<AuthTokens & { deviceId: string }> {
        const candidate = await this.usersService.readUserWithRoles({ email: dto.email })
        if (candidate) {
            throw new BadRequestException(ALREADY_EXISTS_ERROR)
        }
        const hashedPassword = await hash(dto.password, 10)
        const accountActivationToken = uuid.v4()
        const deviceId = randomBytes(16).toString('hex')

        const user = await this.usersService.createUser({
            ...dto,
            password: hashedPassword,
            accountActivationToken,
        })
        const populatedUser = await this.usersService.readUserWithRoles({ _id: user._id })

        const { accessToken, refreshToken } = await this.jwtTokenService.generateTokens(populatedUser)
        await this.jwtTokenService.saveRefreshToken(user._id, refreshToken, deviceId)

        const activationLink = `${this.getApiUrl()}/custom-jwt-auth/activate/${accountActivationToken}`
        const html = await this.sendGridService.renderHtmlFromTemplate(
            path.join(this.viewsPath, 'accountActivation.ejs'),
            { link: activationLink }
        )

        await this.sendGridService.sendMail({
            recipient: user.email,
            subject: 'Account activation',
            text: 'Activate your account to start using our service',
            html
        })
        return { accessToken, refreshToken, deviceId }
    }

    async activateAccount(token: string) {
        const user = await this.usersService.readUserWithRoles({ accountActivationToken: token })
        if (!user) {
            throw new UnauthorizedException(INVALID_ACCOUNT_ACTIVATION_TOKEN_ERROR)
        }
        user.isAccountActivated = true
        user.accountActivationToken = undefined // Delete token after activation
        await user.save()
    }

    async login(dto: CreateUserDto, deviceIdConfig: DeviceIdConfig): Promise<AuthTokens> {
        const user = await this.usersService.readUserWithRoles({ email: dto.email })
        if (!user) {
            throw new UnauthorizedException(NO_USER_FOUND_ERROR)
        }
        const passwordEquals = await compare(dto.password, user.password)
        if (!passwordEquals) {
            throw new UnauthorizedException(WRONG_PASSWORD_ERROR)
        }
        const { accessToken, refreshToken } = await this.jwtTokenService.generateTokens(user)
        await this.jwtTokenService.saveRefreshToken(user._id, refreshToken, deviceIdConfig.value)

        if (deviceIdConfig.isNew) {
            const html = await this.sendGridService.renderHtmlFromTemplate(
                path.join(this.viewsPath, 'newAccountLogin.ejs'),
                { email: user.email },
            )
            const text = `A new login was detected for the account ${user.email}`

            await this.sendGridService.sendMail({
                recipient: user.email,
                subject: 'New account login',
                text,
                html,
            })
            if (user.phoneNumber) {
                await this.smsService.sendSms(user.phoneNumber, text)
            }
        }
        return { accessToken, refreshToken }
    }

    async refreshTokens(inputRefreshToken: string, deviceId: string): Promise<AuthTokens> {
        if (!inputRefreshToken || !deviceId) {
            throw new UnauthorizedException(MISSING_REFRESH_PARAMS_ERROR)
        }
        const userPayload = await this.jwtTokenService.verifyToken(inputRefreshToken)
        const dbToken = await this.jwtRefreshTokenModel.findOne({
            refreshToken: inputRefreshToken,
            deviceId,
        })
        if (!userPayload || !dbToken) {
            throw new UnauthorizedException(INVALID_TOKEN_ERROR)
        }
        const user = await this.usersService.readUserWithRoles({ _id: userPayload._id })
        const { accessToken, refreshToken } = await this.jwtTokenService.generateTokens(user)

        await this.jwtTokenService.saveRefreshToken(user._id, refreshToken, deviceId)
        return { accessToken, refreshToken }
    }

    async logout(inputRefreshToken: string) {
        const deleteTokenResult = await this.jwtTokenService.deleteRefreshToken(inputRefreshToken)
        if (deleteTokenResult.deletedCount === 0) {
            throw new UnauthorizedException(UNAUTHORIZED_ERROR_MSG)
        }
    }

    // prettier-ignore
    async deleteAccount(inputRefreshToken: string) {
        const userPayload = await this.jwtTokenService.verifyToken(inputRefreshToken)
        if (!userPayload) {
            throw new UnauthorizedException(INVALID_TOKEN_ERROR)
        }
        const deleteTokensResult = await this.jwtTokenService.deleteAllRefreshTokens(userPayload._id)

        if (deleteTokensResult.deletedCount === 0) {
            throw new UnauthorizedException(INVALID_TOKEN_ERROR)
        }
        await this.usersService.deleteUserById(userPayload._id)
    }

    async resetPassword(email: string) {
        const user = await this.usersService.readUserWithRoles({ email })
        if (!user) {
            throw new BadRequestException(NO_USER_FOUND_ERROR)
        }
        const resetToken = randomBytes(32).toString('hex')
        user.passwordResetToken = resetToken
        user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 60) // 1 hour
        await user.save()

        const html = await this.sendGridService.renderHtmlFromTemplate(
            path.join(this.viewsPath, 'passwordReset.ejs'),
            { email, resetToken },
        )
        await this.sendGridService.sendMail({
            recipient: user.email,
            subject: 'Password Reset',
            text: 'Reset your password using the token below',
            html,
        })
    }

    async updatePassword(token: string, newPassword: string) {
        const user = await this.usersService.readUserWithRoles({ passwordResetToken: token })
        if (!user || user.passwordResetExpires < new Date()) {
            throw new BadRequestException(INVALID_TOKEN_ERROR)
        }
        user.password = await hash(newPassword, 10)
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined

        await user.save()
    }

    private getApiUrl(): string {
        const url =
            `${this.configService.get<string>('PROTOCOL', 'http://')}` +
            `${this.configService.get<string>('HOST', 'localhost:5000')}`

        return url
    }
}
