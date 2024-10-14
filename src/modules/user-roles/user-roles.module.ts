import { forwardRef, Module } from '@nestjs/common'
import { UserRolesController } from './user-roles.controller'
import { UserRolesService } from './user-roles.service'
import { MongooseModule } from '@nestjs/mongoose'
import { UserRole, UserRoleSchema } from './user-roles.schema'
import { CustomJwtAuthModule } from '../auth/custom-jwt-auth/custom-jwt-auth.module'

@Module({
    imports: [
        forwardRef(() => CustomJwtAuthModule),
        MongooseModule.forFeature([{ name: UserRole.name, schema: UserRoleSchema }]),
    ],
    controllers: [UserRolesController],
    providers: [UserRolesService],
    exports: [UserRolesService],
})
export class UserRolesModule {}
