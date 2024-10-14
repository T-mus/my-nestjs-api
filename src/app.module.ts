import { APP_FILTER } from '@nestjs/core'
import { AppController } from './app.controller'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { UsersModule } from './modules/users/users.module'
import { CustomJwtAuthModule } from './modules/auth/custom-jwt-auth/custom-jwt-auth.module'
import { MongooseModule } from '@nestjs/mongoose'
import { getMongoConfig } from './config/mongo.config'
import { UserRolesModule } from './modules/user-roles/user-roles.module'
import { ProductsModule } from './modules/products/products.module'

@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath: `.${process.env.NODE_ENV}.env`, isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: getMongoConfig,
        }),
        UsersModule,
        CustomJwtAuthModule,
        UserRolesModule,
        ProductsModule,
    ],
    controllers: [AppController],
})
export class AppModule {}
