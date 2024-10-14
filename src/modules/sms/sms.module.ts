import { DynamicModule, Module } from '@nestjs/common'
import { SmsModuleAsyncOptions } from './sms.types'
import { SmsService } from './sms.service'
import { SMS_MODULE_OPTIONS } from './sms.constants'

@Module({})
export class SmsModule {
    static forRootAsync(options: SmsModuleAsyncOptions): DynamicModule {
        return {
            module: SmsModule,
            imports: options.imports,
            providers: [
                SmsService,
                {
                    provide: SMS_MODULE_OPTIONS,
                    inject: options.inject,
                    useFactory: async (...args: any[]) => options.useFactory(...args),
                },
            ],
            exports: [SmsService],
        }
    }
}
