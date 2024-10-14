import { forwardRef, Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { MongooseModule } from '@nestjs/mongoose'
import { User, UserSchema } from './users.schema'
import { UserRolesModule } from '../user-roles/user-roles.module'
import { CustomJwtAuthModule } from '../auth/custom-jwt-auth/custom-jwt-auth.module'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        forwardRef(() => UserRolesModule),
        forwardRef(() => CustomJwtAuthModule),
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule {}
