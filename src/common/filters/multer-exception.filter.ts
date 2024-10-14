import { ExceptionFilter, Catch, ArgumentsHost, PayloadTooLargeException } from '@nestjs/common'
import { MulterError } from 'multer'
import { UploadFileError } from '../errors/upload-file-error'
import { UploadFileErrorMessages } from '../constants/upload-file.constants'

// prettier-ignore
@Catch(PayloadTooLargeException, UploadFileError, MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
    catch(exception: PayloadTooLargeException | UploadFileError, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const request = ctx.getRequest()
        const response = ctx.getResponse()

        let status = 400
        let message = 'An error occurred during file upload'
        const maxSize = request.customLimits?.maxSize

        if (exception instanceof PayloadTooLargeException) {
            status = 413
            message = maxSize
                ? `File too large. Maximum size allowed is ${(maxSize / (1024 * 1024)).toFixed(2)} MB.`
                : 'File too large.'
        }

        if (exception instanceof UploadFileError) {
            switch (exception.code) {
                case 'UNSUPPORTED_FILE_TYPE':
                    message = exception.message ?? UploadFileErrorMessages.UNSUPPORTED_FILE_TYPE_MSG
                    break
                case 'UNSUPPORTED_FILE_FORMAT':
                    message =
                        exception.message ?? UploadFileErrorMessages.UNSUPPORTED_FILE_FORMAT_MSG
                    break
                default:
                    break
            }
        }

        response.status(status).json({
            statusCode: status,
            message: message,
            error: 'File Upload Error',
        })
    }
}
