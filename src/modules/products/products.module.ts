import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { getMulterConfig } from '../../config/multer.config'
import { MongooseModule } from '@nestjs/mongoose'
import { Product, ProductSchema } from './product.schema'
import { ProductsService } from './products.service'
import { ImageProcessingModule } from '../image-processing/image-processing.module'
import { FileStorageModule } from '../file-storage/file-storage.module'
import { AzureStorageModule } from '../file-storage/azure-storage/azure-storage.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { getAzureStorageConfig } from '../../config/azure-storage.config'
import { ProductsController } from './products.controller'
import { ProductsGateway } from './products.gateway';

// prettier-ignore
@Module({
    imports: [
        MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
        MulterModule.registerAsync({
            useFactory: () =>
                getMulterConfig({
                    allowedTypes: ['image', 'video'],
                    allowedFormats: ['jpg', 'jpeg', 'png', 'mp4'], 
                    maxSize: 50 * 1024 * 1024, // 50 MB
                }),
        }),
        ImageProcessingModule.forFeature({}),
        FileStorageModule.forRoot(
            AzureStorageModule.forRootAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: getAzureStorageConfig,
            }),
        ),
    ],
    controllers: [ProductsController],
    providers: [ProductsService, ProductsGateway],
})
export class ProductsModule {}
