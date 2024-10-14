import { ConfigService } from '@nestjs/config'
import { SmsModuleOptions } from '../modules/sms/sms.types'

export const getSmsConfig = (configService: ConfigService): SmsModuleOptions => {
    const serviceId = configService.get('TWILIO_SID')
    if (!serviceId) {
        throw new Error('TWILIO_SID is not specified')
    }
    const authToken = configService.get('TWILIO_AUTH_TOKEN')
    if (!authToken) {
        throw new Error('TWILIO_AUTH_TOKEN is not specified')
    }
    const phoneNumber = configService.get('TWILIO_PHONE_NUMBER')
    if (!phoneNumber) {
        throw new Error('TWILIO_PHONE_NUMBER is not specified')
    }
    return { serviceId, authToken, phoneNumber }
}
