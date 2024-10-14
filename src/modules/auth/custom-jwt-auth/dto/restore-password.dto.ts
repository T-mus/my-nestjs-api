import { IsString, Length } from 'class-validator'
import { IsEmailDeepValid } from '../../../../common/validators/is-email-deep-valid.validator'

export class PasswordResetDto {
    @IsEmailDeepValid()
    readonly email: string
}

export class PasswordUpdateDto {
    @IsString()
    readonly token: string

    @IsString()
    @Length(5, 30)
    readonly newPassword: string
}
