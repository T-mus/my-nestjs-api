import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Product } from './product.schema'
import { CreateProductDto } from './dto/create-product.dto'
import { ImageProcessingService } from '../image-processing/image-processing.service'
import { FileStorageService } from '../file-storage/file-storage.service'

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<Product>,
        private imageProcessingService: ImageProcessingService,
        private fileStorageService: FileStorageService,
    ) {}

    async createProduct(dto: CreateProductDto) {
        try {
            const newProduct = new this.productModel(dto)
            if (dto.files.length > 0) {
                /* 
                    Create a filter that will divide videos and images into two different groups
                    and then call the appropriate service to process the files
                */
                const processedFiles = await this.imageProcessingService.processImages(dto.files)
                const fileUrls = await this.fileStorageService.uploadFiles({
                    files: processedFiles,
                    options: { containerName: 'products' },
                })
                newProduct.files = fileUrls
            }
            await newProduct.save()
        } catch (error) {
            console.error(error.message)
            throw new InternalServerErrorException(error.message)
        }
    }
}
