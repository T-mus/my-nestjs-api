import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber'

@Injectable()
export class FormatPhoneNumberInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest()
        const phoneNumber = request.body.phoneNumber

        if (phoneNumber) {
            try {
                const phoneUtil = PhoneNumberUtil.getInstance()
                const parsedPhoneNumber = phoneUtil.parse(phoneNumber)

                if (phoneUtil.isValidNumber(parsedPhoneNumber)) {
                    request.body.phoneNumber = phoneUtil.format(
                        parsedPhoneNumber,
                        PhoneNumberFormat.E164,
                    )
                }
            } catch (error) {
                console.error('Invalid phone number:', error.message)
            }
        }

        return next.handle().pipe(map((data) => data))
    }
}
