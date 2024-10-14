export type MulterConfigOptions = Partial<{
    allowedTypes: string[] // ['image', 'video']
    allowedFormats: string[] // ['jpg', 'png', 'mp4']
    maxSize: number
    maxCount: number
}>
