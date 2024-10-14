import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator'
import { PhoneNumberUtil } from 'google-libphonenumber'
import { INVALID_PHONE_NUMBER_ERROR } from '../constants/validation-messages.constants'

const phoneUtil = PhoneNumberUtil.getInstance()

@ValidatorConstraint({ async: false })
export class IsPhoneNumberValidConstraint implements ValidatorConstraintInterface {
    validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
        if (!value) {
            return true
        }
        try {
            const phoneNumber = phoneUtil.parse(value)
            console.log('test')

            return phoneUtil.isValidNumber(phoneNumber)
        } catch (error) {
            console.error('Invalid phone number:', error.message)
        }
    }

    defaultMessage(args: ValidationArguments): string {
        return INVALID_PHONE_NUMBER_ERROR
    }
}

export function IsPhoneNumberValid(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsPhoneNumberValidConstraint,
        })
    }
}
