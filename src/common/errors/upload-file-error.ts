import { UploadFileErrorCodes } from '../constants/upload-file.constants'

export class UploadFileError extends Error {
    constructor(
        public code: keyof typeof UploadFileErrorCodes,
        message: string = 'An error occurred during file upload',
    ) {
        super(message)
    }
}
