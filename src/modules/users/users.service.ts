import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { User } from './users.schema'
import { Model, Types } from 'mongoose'
import { CreateUserDto } from './dtos/create-user.dto'
import { AssignUserRoleDto } from './dtos/assign-user-role.dto'
import { UserRolesService } from '../user-roles/user-roles.service'
import { UserRole } from '../user-roles/user-roles.schema'
import { ReadAllUsersResponse, UserWithRoles, UserWithRolesFilter } from './users.types'
import { PaginationQueryDto } from './dtos/pagination-query.dto'

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private userRolesService: UserRolesService,
    ) {}

    async createUser(dto: CreateUserDto & { accountActivationToken: string }) {
        const role = await this.userRolesService.readUserRoleByValue('USER')
        return this.userModel.create({ ...dto, roles: [role._id] })
    }

    async readAllUsers(filters: PaginationQueryDto): Promise<ReadAllUsersResponse> {
        const { page = 1, limit = 10 } = filters
        const skip = (page - 1) * limit

        const usersAggregation = this.userModel.aggregate([
            {
                $lookup: {
                    from: 'user-roles',
                    localField: 'roles',
                    foreignField: '_id',
                    as: 'roles',
                },
            },
            {
                $unset: [
                    'password',
                    'accountActivationToken',
                    'passwordResetToken',
                    'passwordResetExpires',
                ],
            },
            { $sort: { _id: 1 } },
            { $skip: skip },
            { $limit: limit },
        ])

        const totalUsersCount = await this.userModel.countDocuments()
        const totalPages = Math.ceil(totalUsersCount / limit)

        const users = await usersAggregation.exec()
        return { users, total: totalUsersCount, totalPages }
    }

    async readUserWithRoles(filter: UserWithRolesFilter): Promise<UserWithRoles> {
        const user = await this.userModel
            .findOne(filter)
            .populate({ path: 'roles', model: UserRole.name })
            .exec()

        return user as UserWithRoles
    }

    async assignUserRole(dto: AssignUserRoleDto) {}

    async deleteUserById(id: Types.ObjectId) {
        return this.userModel.deleteOne({ _id: id }).exec()
    }
}
