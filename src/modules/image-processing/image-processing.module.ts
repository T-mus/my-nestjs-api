import { DynamicModule, Module } from '@nestjs/common'
import { ImageProcessingService } from './image-processing.service'
import { ImageProcessingMooduleOptions } from './image-processing.types'
import { IMAGE_PROCESSING_MODULE_OPTIONS } from './image-processing.constants'

@Module({})
export class ImageProcessingModule {
    static forFeature(options: ImageProcessingMooduleOptions): DynamicModule {
        return {
            module: ImageProcessingModule,
            providers: [
                ImageProcessingService,
                {
                    provide: IMAGE_PROCESSING_MODULE_OPTIONS,
                    useValue: options,
                },
            ],
            exports: [ImageProcessingService],
        }
    }
}
