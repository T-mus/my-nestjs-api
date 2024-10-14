import { ConfigService } from '@nestjs/config'
import { AzureStorageModuleOptions } from '../modules/file-storage/azure-storage/azure-storage.types'

export const getAzureStorageConfig = (configService: ConfigService): AzureStorageModuleOptions => {
    const storageName = configService.get<string>('AZURE_STORAGE_ACCOUNT_NAME', 'wedevstudystorage')
    return { storageName }
}
