import { forwardRef, Module } from '@nestjs/common'
import { CustomJwtAuthController } from './custom-jwt-auth.controller'
import { CustomJwtAuthService } from './custom-jwt-auth.service'
import { UsersModule } from '../../users/users.module'
import { MongooseModule } from '@nestjs/mongoose'
import { JwtRefreshToken, JwtRefreshTokenSchema } from './jwt-refresh-token.schema'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { getJwtConfig } from '../../../config/jwt.config'
import { JwtTokenService } from './jwt-token.service'
import { SendGridModule } from '../../send-grid/send-grid.module'
import { getSendGridConfig } from '../../../config/send-grid.config'
import { SmsModule } from '../../sms/sms.module'
import { getSmsConfig } from '../../../config/sms.config'

@Module({
    imports: [
        forwardRef(() => UsersModule),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: getJwtConfig,
        }),
        MongooseModule.forFeature([{ name: JwtRefreshToken.name, schema: JwtRefreshTokenSchema }]),
        SendGridModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: getSendGridConfig,
        }),
        SmsModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: getSmsConfig,
        }),
    ],
    controllers: [CustomJwtAuthController],
    providers: [CustomJwtAuthService, JwtTokenService],
    exports: [JwtModule],
})
export class CustomJwtAuthModule {}
