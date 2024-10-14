import * as sharp from 'sharp'

/**
 * Image resolution options
 */
export type ResolutionOptions = 1920 | 1366 | 720 | 480

/**
 * Options fo the image processing module
 */
export type ImageProcessingMooduleOptions = {
    /**
     * Formats for the image conversion (default - ['jpeg', 'webp'])
     */
    conversionFormats?: Array<keyof sharp.FormatEnum>
    /**
     * JPEG post compression quality (0-100). Lower value results in more compression and lower quality. (default - 85)
     */
    postCompressionQuality?: number
    /**
     * Resolutions for the image resizing (default - [1920, 1366, 720, 360])
     */
    resolutionOptions?: ResolutionOptions[]
}

export type ProcessedFile = {
    filename: string
    buffer: Buffer
}
