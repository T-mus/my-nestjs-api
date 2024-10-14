import { IsString, IsMongoId } from 'class-validator'
import { Types } from 'mongoose'

export class AssignUserRoleDto {
    @IsString()
    readonly value: string

    @IsMongoId()
    readonly userId: Types.ObjectId
}
