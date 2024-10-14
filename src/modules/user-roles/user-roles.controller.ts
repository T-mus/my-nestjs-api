import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { CreateUserRoleDto } from './dtos/create-user-role.dto'
import { UserRolesService } from './user-roles.service'
import { Roles } from '../../common/decorators/roles.decorator'
import { RolesGuard } from '../../common/guards/roles.guard'

@Roles('ADMIN')
@UseGuards(RolesGuard)
@Controller('user-roles')
export class UserRolesController {
    constructor(private userRolesService: UserRolesService) {}

    @Post()
    create(@Body() dto: CreateUserRoleDto) {
        return this.userRolesService.createUserRole(dto)
    }

    @Get()
    readAll() {
        return this.userRolesService.readAllUserRoles()
    }
}
