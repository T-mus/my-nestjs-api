import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common'
import { SMS_MODULE_OPTIONS } from './sms.constants'
import { SmsModuleOptions } from './sms.types'
import * as Twilio from 'twilio'

@Injectable()
export class SmsService {
    private twilioClient: Twilio.Twilio

    constructor(@Inject(SMS_MODULE_OPTIONS) private options: SmsModuleOptions) {
        this.twilioClient = Twilio(this.options.serviceId, options.authToken)
    }

    async sendSms(to: string, message: string): Promise<void> {
        try {
            await this.twilioClient.messages.create({
                body: message,
                from: this.options.phoneNumber,
                to,
            })
            console.log(`SMS sent to ${to}`)
        } catch (error) {
            console.error('Error sending SMS:', error)
            throw new InternalServerErrorException('Failed to send SMS')
        }
    }
}
