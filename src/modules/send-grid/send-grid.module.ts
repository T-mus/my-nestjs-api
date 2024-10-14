import { DynamicModule, Module } from '@nestjs/common'
import { SendGridService } from './send-grid.service'
import { SendGridModuleAsyncOptions } from './send-grid.types'
import { SEND_GRID_MODULE_OPTIONS } from './send-drid.constants'

@Module({})
export class SendGridModule {
    static forRootAsync(options: SendGridModuleAsyncOptions): DynamicModule {
        return {
            module: SendGridModule,
            imports: options.imports,
            providers: [
                SendGridService,
                {
                    provide: SEND_GRID_MODULE_OPTIONS,
                    inject: options.inject || [],
                    useFactory: async (...args: any[]) => options.useFactory(...args),
                },
            ],
            exports: [SendGridService],
        }
    }
}
