import { ConfigService } from '@nestjs/config'
import { SendGridModuleOptions } from '../modules/send-grid/send-grid.types'

export const getSendGridConfig = (configService: ConfigService): SendGridModuleOptions => {
    const apiKey = configService.get('SG_API_KEY')
    if (!apiKey) {
        throw new Error('SG_API_KEY is not specified')
    }
    const sender = configService.get('SG_VERIFIED_SENDER')
    if (!sender) {
        throw new Error('SG_VERIFIED_SENDER is not specified')
    }
    return { apiKey, sender }
}
