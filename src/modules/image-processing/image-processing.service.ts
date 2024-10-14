import { Inject, Injectable } from '@nestjs/common'
import {
    ImageProcessingMooduleOptions,
    ProcessedFile,
    ResolutionOptions,
} from './image-processing.types'
import { IMAGE_PROCESSING_MODULE_OPTIONS } from './image-processing.constants'
import * as sharp from 'sharp'
import { format } from 'date-fns'

@Injectable()
export class ImageProcessingService {
    private conversionFormats: Array<keyof sharp.FormatEnum>
    private resolutionOptions: ResolutionOptions[]
    private postCompressionQuality: number

    // prettier-ignore
    constructor(
        @Inject(IMAGE_PROCESSING_MODULE_OPTIONS) private processingOptions: ImageProcessingMooduleOptions,
    ) {
        this.conversionFormats = this.processingOptions.conversionFormats ?? ['jpeg', 'webp']
        this.resolutionOptions = this.processingOptions.resolutionOptions ?? [1920, 1366, 720, 480]
        this.postCompressionQuality = this.processingOptions.postCompressionQuality ?? 90
    }

    async processImages(files: Express.Multer.File[]): Promise<ProcessedFile[]> {
        const processedFiles: ProcessedFile[] = []
        const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')

        for (const file of files) {
            const originalBuffer = file.buffer
            const metadata = await sharp(originalBuffer).metadata()

            // Step 1: Convert to the formats specified in converionFormats
            for (const format of this.conversionFormats) {
                let processedBuffer = await this.convertImage(originalBuffer, format)
                let hasResizedAtLeastOnce = false

                // Step 2: If JPEG format, apply compression
                if (format === 'jpeg' || format === 'jpg') {
                    processedBuffer = await this.compressJPEG(processedBuffer)
                }

                // Step 3: Resize to each resolution specified in resolutionOptions
                for (const resolution of this.resolutionOptions) {
                    if (metadata.width < resolution) {
                        continue
                    }
                    const resizedBuffer = await this.resizeImage(processedBuffer, resolution)
                    const filename = `${file.originalname}_${resolution}p_${timestamp}.${format}`

                    processedFiles.push({ filename, buffer: resizedBuffer })
                    hasResizedAtLeastOnce = true
                }

                if (!hasResizedAtLeastOnce) {
                    const filename = `${file.originalname}_${timestamp}.${format}`
                    processedFiles.push({ filename, buffer: processedBuffer })
                }
            }
        }
        return processedFiles
    }

    private async convertImage(buffer: Buffer, format: keyof sharp.FormatEnum): Promise<Buffer> {
        return sharp(buffer).toFormat(format).toBuffer()
    }

    private async compressJPEG(file: Buffer): Promise<Buffer> {
        const quality = this.postCompressionQuality
        if (quality < 0 || quality > 100) {
            throw new Error('JPEG compress quality must be between 0 and 100.')
        }
        return sharp(file)
            .jpeg({
                quality: this.postCompressionQuality,
                mozjpeg: true,
            })
            .toBuffer()
    }

    private async resizeImage(file: Buffer, resolution: ResolutionOptions): Promise<Buffer> {
        return sharp(file).resize(resolution).toBuffer()
    }
}
