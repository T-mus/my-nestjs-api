import {
    Body,
    Controller,
    Delete,
    Get,
    Patch,
    Post,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { CreateProductDto } from './dto/create-product.dto'
import { getMulterConfig } from 'src/config/multer.config'
import { ProductsService } from './products.service'
import { CREATE_PRODUCT_SUCCESS } from './products.constants'

@Controller('products')
export class ProductsController {
    constructor(private productsService: ProductsService) {}
    // prettier-ignore
    /* @UseInterceptors(FilesInterceptor('files', Infinity, getMulterConfig({
        allowedTypes: ['image', 'video'],
        allowedFormats: ['jpg', 'png', 'mp4'],
        maxSize: 50 * 1024 * 1024, // 50 MB
    }))) */
    @UseInterceptors(FilesInterceptor('files', 10))
    @Post()
    async create(@Body() dto: CreateProductDto, @UploadedFiles() files: Express.Multer.File[]) {
        await this.productsService.createProduct({ ...dto, files: files || [] })
        return { message: CREATE_PRODUCT_SUCCESS }
    }

    @Get()
    readAll() {}

    @Get(':id')
    readOne() {}

    @Patch(':id')
    update() {}

    @Delete(':id')
    delete() {}
}
