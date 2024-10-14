import { DynamicModule, Module } from '@nestjs/common'
import { AzureStorageService } from './azure-storage.service'
import { AzureStorageModuleAsyncOptions } from './azure-storage.types'
import { AZURE_STORAGE_MODULE_OPTIONS } from './azure-storage.constants'

@Module({})
export class AzureStorageModule {
    static forRootAsync(options: AzureStorageModuleAsyncOptions): DynamicModule {
        return {
            module: AzureStorageModule,
            imports: options.imports,
            providers: [
                AzureStorageService,
                {
                    provide: AZURE_STORAGE_MODULE_OPTIONS,
                    inject: options.inject,
                    useFactory: async (...args: any[]) => options.useFactory(...args),
                },
            ],
            exports: [AzureStorageService],
        }
    }
}
