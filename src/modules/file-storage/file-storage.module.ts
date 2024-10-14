import { DynamicModule, Module } from '@nestjs/common'
import { FileStorageService } from './file-storage.service'

@Module({})
export class FileStorageModule {
    static forRoot(fileStorageProvider: DynamicModule): DynamicModule {
        return {
            module: FileStorageModule,
            imports: [fileStorageProvider],
            providers: [FileStorageService],
            exports: [FileStorageService],
        }
    }
}
