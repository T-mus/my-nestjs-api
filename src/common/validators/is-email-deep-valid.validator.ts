import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator'
import * as deepEmailValidator from 'deep-email-validator'
import { INVALID_EMAIL_ERROR } from '../constants/validation-messages.constants'

// prettier-ignore
@ValidatorConstraint({ async: true })
export class IsEmailDeepValidConstraint implements ValidatorConstraintInterface {
    async validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> {
        const response = await deepEmailValidator.validate({
            email: value,
            validateSMTP: false
        })
        
        return response.valid
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return INVALID_EMAIL_ERROR
    }
}

export function IsEmailDeepValid(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsEmailDeepValidConstraint,
        })
    }
}
