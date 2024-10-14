import { Injectable } from '@nestjs/common'
import { AzureStorageService } from './azure-storage/azure-storage.service'
import { DeleteFilesParams, UploadFilesParams } from './file-storage.types'
import { AzureUploadOptions } from './azure-storage/azure-storage.types'

@Injectable()
export class FileStorageService {
    constructor(private implementation: AzureStorageService) {}

    async uploadFiles(params: UploadFilesParams<AzureUploadOptions>): Promise<string[]> {
        const fileUrls = await this.implementation.uploadFiles(params)
        return fileUrls
    }

    async deleteFiles(params: DeleteFilesParams<AzureUploadOptions>) {
        await this.implementation.deleteFiles(params)
    }
}
