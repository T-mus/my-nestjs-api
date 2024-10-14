import { Injectable } from '@nestjs/common'
import { CreateUserRoleDto } from './dtos/create-user-role.dto'
import { InjectModel } from '@nestjs/mongoose'
import { UserRole } from './user-roles.schema'
import { Model } from 'mongoose'

@Injectable()
export class UserRolesService {
    constructor(@InjectModel(UserRole.name) private userRoleModel: Model<UserRole>) {}

    async createUserRole(dto: CreateUserRoleDto): Promise<UserRole> {
        const role = await this.userRoleModel.create(dto)
        return role
    }

    async readAllUserRoles(): Promise<UserRole[]> {
        return this.userRoleModel.find().exec()
    }

    async readUserRoleByValue(value: string): Promise<UserRole> {
        const role = await this.userRoleModel.findOne({ value }).exec()
        return role
    }
}
