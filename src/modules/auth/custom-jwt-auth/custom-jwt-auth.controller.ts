import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Post,
    Redirect,
    Req,
    Res,
    UseInterceptors,
    ValidationPipe,
} from '@nestjs/common'
import { CreateUserDto } from '../../users/dtos/create-user.dto'
import { CustomJwtAuthService } from './custom-jwt-auth.service'
import { Request, Response } from 'express'
import { ConfigService } from '@nestjs/config'
import { toMs } from 'ms-typescript'
import {
    ACCOUNT_DELETION_SUCCESS,
    LOGOUT_SUCCESS,
    PASSWORD_RESET_SUCCESS_MSG,
    PASSWORD_UPDATE_SUCCESS_MSG,
} from './custom.jwt-auth.constants'
import { PasswordResetDto, PasswordUpdateDto } from './dto/restore-password.dto'
import { randomBytes } from 'crypto'
import { DeviceIdConfig } from './custom-jwt-auth.types'
import { FormatPhoneNumberInterceptor } from '../../../common/interceptors/format-phone-number.interceptor'

@Controller('custom-jwt-auth')
export class CustomJwtAuthController {
    constructor(
        private customJwtAuthService: CustomJwtAuthService,
        private configService: ConfigService,
    ) {}

    // prettier-ignore
    @UseInterceptors(FormatPhoneNumberInterceptor)
    @Post('register')
    async register(
        @Res({ passthrough: true }) res: Response,
        @Body(ValidationPipe) dto: CreateUserDto,
    ) {
        const { accessToken, refreshToken, deviceId } = await this.customJwtAuthService.register(dto)

        this.setAuthCookies(res, refreshToken)
        this.setDeviceCookies(res, deviceId)

        return { accessToken }
    }

    // prettier-ignore
    @Redirect()
    @Get('activate/:token')
    async activateAccount(@Param('token') token: string) {
        const clientBaseUrl = this.configService.get<string>('CLIENT_BASE_URL', 'http://localhost:3000')
        try {
            await this.customJwtAuthService.activateAccount(token)
            return { url: `${clientBaseUrl}/activation-success` }
        } catch (error) {
            return { url: `${clientBaseUrl}/activation-failure` }
        }
    }

    // prettier-ignore
    @HttpCode(200)
    @Post('login')
    async login(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @Body(ValidationPipe) dto: CreateUserDto,
    ) {
        let deviceId = req.cookies['deviceId']
        let deviceIdConfig: DeviceIdConfig = { value: deviceId, isNew: false }
        
        if (!deviceId) {
            deviceIdConfig.value = randomBytes(16).toString('hex')
            deviceIdConfig.isNew = true

            this.setDeviceCookies(res, deviceIdConfig.value)
        }
        const { accessToken, refreshToken } = await this.customJwtAuthService.login(dto, deviceIdConfig)
        this.setAuthCookies(res, refreshToken)

        return { accessToken }
    }

    // prettier-ignore
    @Get('refresh')
    async refreshTokens(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const inputRefreshToken = req.cookies['refreshToken']
        const deviceId = req.cookies['deviceId']
        
        const { accessToken, refreshToken } = await this.customJwtAuthService.refreshTokens(inputRefreshToken, deviceId)
        this.setAuthCookies(res, refreshToken)

        return { accessToken }
    }

    @Get('logout')
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const inputRefreshToken = req.cookies['refreshToken']
        await this.customJwtAuthService.logout(inputRefreshToken)

        res.clearCookie('refreshToken')
        res.clearCookie('deviceId')

        return { message: LOGOUT_SUCCESS }
    }

    @Get('delete')
    async deleteAccount(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const inputRefreshToken = req.cookies['refreshToken']
        await this.customJwtAuthService.deleteAccount(inputRefreshToken)

        res.clearCookie('refreshToken')
        res.clearCookie('deviceId')

        return { message: ACCOUNT_DELETION_SUCCESS }
    }

    @HttpCode(200)
    @Post('reset-password')
    async resetPassword(@Body() dto: PasswordResetDto) {
        await this.customJwtAuthService.resetPassword(dto.email)
        return { message: PASSWORD_RESET_SUCCESS_MSG }
    }

    @HttpCode(200)
    @Post('update-password')
    async updatePassword(@Body() dto: PasswordUpdateDto) {
        await this.customJwtAuthService.updatePassword(dto.token, dto.newPassword)
        return { message: PASSWORD_UPDATE_SUCCESS_MSG }
    }

    private setAuthCookies(res: Response, refreshToken: string): void {
        res.cookie('refreshToken', refreshToken, {
            maxAge: toMs(this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION', '30d')), // parse into ms
            httpOnly: true,
            sameSite: 'none',
            secure: this.configService.get('NODE_ENV') === 'production',
        })
    }

    private setDeviceCookies(res: Response, deviceId: string) {
        res.cookie('deviceId', deviceId, {
            httpOnly: true,
            sameSite: 'none',
            secure: this.configService.get('NODE_ENV') === 'production',
        })
    }
}
