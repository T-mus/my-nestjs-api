import { Inject, Injectable } from '@nestjs/common'
import {
    DeleteFilesParams,
    FileStorageServiceImplementation,
    UploadFilesParams,
} from '../file-storage.types'
import {
    AzureDeleteOptions,
    AzureStorageModuleOptions,
    AzureUploadOptions,
} from './azure-storage.types'
import { BlobServiceClient } from '@azure/storage-blob'
import { AZURE_STORAGE_MODULE_OPTIONS } from './azure-storage.constants'
import { DefaultAzureCredential } from '@azure/identity'
import * as stream from 'stream'

@Injectable()
export class AzureStorageService implements FileStorageServiceImplementation {
    private blobServiceClient: BlobServiceClient

    constructor(@Inject(AZURE_STORAGE_MODULE_OPTIONS) private options: AzureStorageModuleOptions) {
        this.blobServiceClient = new BlobServiceClient(
            `https://${this.options.storageName}.blob.core.windows.net`,
            new DefaultAzureCredential(),
        )
    }

    // prettier-ignore
    async uploadFiles(params: UploadFilesParams<AzureUploadOptions>): Promise<string[]> {
        const fileUrls = []
        const { files, options } = params
        const containerClient = this.blobServiceClient.getContainerClient(options.containerName)

        for (const file of files) {
            const blockBlobClient = containerClient.getBlockBlobClient(file.filename)

            const readableStream = new stream.PassThrough()
            readableStream.end(file.buffer)

            await blockBlobClient.uploadStream(readableStream, file.buffer.length)
            fileUrls.push(blockBlobClient.url)
        }
        return fileUrls
    }

    async deleteFiles(params: DeleteFilesParams<AzureDeleteOptions>) {
        const { fileUrls, options } = params

        const containerClient = this.blobServiceClient.getContainerClient(options.containerName)
        const fileNames = fileUrls.map((fileUrl) => fileUrl.split(`/${options.containerName}/`)[1])

        for (const fileName of fileNames) {
            const blockBlobClient = containerClient.getBlockBlobClient(fileName)
            blockBlobClient.deleteIfExists()
        }
    }
}
