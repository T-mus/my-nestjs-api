import { ModuleMetadata } from '@nestjs/common'
import { DeleteFilesParams, UploadFilesParams } from '../file-storage.types'

export type AzureStorageModuleOptions = {
    storageName: string
}

export type AzureStorageModuleAsyncOptions = Pick<ModuleMetadata, 'imports'> & {
    inject?: any[]
    useFactory: (...args: any[]) => Promise<AzureStorageModuleOptions> | AzureStorageModuleOptions
}

export type AzureUploadOptions = { containerName: string }

export type AzureDeleteOptions = { containerName: string }
