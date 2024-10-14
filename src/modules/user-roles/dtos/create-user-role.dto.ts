import { IsString } from 'class-validator'

export class CreateUserRoleDto {
    @IsString()
    value: string

    @IsString()
    description: string
}
