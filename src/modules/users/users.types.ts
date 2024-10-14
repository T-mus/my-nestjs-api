import { Types } from 'mongoose'
import { UserRole } from '../user-roles/user-roles.schema'
import { User } from './users.schema'

export type UserWithRolesFilter = Partial<{
    _id: Types.ObjectId
    email: string
    accountActivationToken: string
    passwordResetToken: string
}>

export type UserWithRoles = User & { roles: UserRole[] }

export type ReadAllUsersResponse = {
    users: Array<{
        _id: string
        email: string
        phoneNumber?: string
        roles: Array<{
            _id: string
            value: string
            description: string
        }>
        isAccountActivated: boolean
    }>
    total: number
    totalPages: number
}
