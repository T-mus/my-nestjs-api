import { ProcessedFile } from '../image-processing/image-processing.types'

export type UploadFilesParams<TOptions = any> = {
    files: ProcessedFile[]
    options?: TOptions
}

export type DeleteFilesParams<TOptions = any> = {
    fileUrls: string[]
    options?: TOptions
}

export interface FileStorageServiceImplementation {
    uploadFiles: (params: UploadFilesParams) => Promise<string[]>

    deleteFiles: (params: DeleteFilesParams) => Promise<void>
}
