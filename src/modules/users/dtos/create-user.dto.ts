import { IsOptional, IsString, Length } from 'class-validator'
import { IsEmailDeepValid } from '../../../common/validators/is-email-deep-valid.validator'
import { IsPhoneNumberValid } from '../../../common/validators/is-phone-number-valid.validator'
import { INVALID_PASSWORD_LENGTH_ERROR } from '../../auth/custom-jwt-auth/custom.jwt-auth.constants'

export class CreateUserDto {
    @IsEmailDeepValid()
    readonly email: string

    @IsString()
    @Length(5, 30, { message: INVALID_PASSWORD_LENGTH_ERROR })
    readonly password: string

    @IsOptional()
    @IsPhoneNumberValid()
    readonly phoneNumber?: string
}
