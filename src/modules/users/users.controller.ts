import { Body, Controller, Get, Post, Query, UseGuards, ValidationPipe } from '@nestjs/common'
import { UsersService } from './users.service'
import { AssignUserRoleDto } from './dtos/assign-user-role.dto'
import { Roles } from '../../common/decorators/roles.decorator'
import { RolesGuard } from '../../common/guards/roles.guard'
import { PaginationQueryDto } from './dtos/pagination-query.dto'

@Roles('ADMIN')
@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
    constructor(private usersServise: UsersService) {}

    @Get()
    readAll(@Query(new ValidationPipe({ transform: true })) query: PaginationQueryDto) {
        return this.usersServise.readAllUsers(query)
    }

    @Post()
    assignRole(@Body() dto: AssignUserRoleDto) {
        return this.usersServise.assignUserRole(dto)
    }
}
