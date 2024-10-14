import { MulterModuleOptions } from '@nestjs/platform-express'
import { memoryStorage, MulterError } from 'multer'
import { MulterConfigOptions } from '../common/types/multer.config.types'
import { UploadFileError } from '../common/errors/upload-file-error'

export const getMulterConfig = (options: MulterConfigOptions): MulterModuleOptions => ({
    storage: memoryStorage(),
    limits: {
        fileSize: options.maxSize ?? Infinity,
        files: options.maxCount ?? Infinity,
    },
    fileFilter: (req, file, callback) => {
        req.customLimits = {
            maxSize: options.maxSize ?? Infinity,
        }
        const [fileType, fileFormat] = file.mimetype.split('/')

        if (options.allowedTypes && !options.allowedTypes.includes(fileType)) {
            return callback(
                new UploadFileError('UNSUPPORTED_FILE_TYPE', `Unsupported file type: ${fileType}`),
                false,
            )
        }
        if (options.allowedFormats && !options.allowedFormats.includes(fileFormat)) {
            return callback(
                new UploadFileError(
                    'UNSUPPORTED_FILE_FORMAT',
                    `Unsupported file format: ${fileFormat}`,
                ),
                false,
            )
        }
        callback(null, true)
    },
})
