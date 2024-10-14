import { ModuleMetadata } from '@nestjs/common'

export type SmsModuleOptions = {
    serviceId: string
    authToken: string
    phoneNumber: string
}

export type SmsModuleAsyncOptions = Pick<ModuleMetadata, 'imports'> & {
    inject?: any[]
    useFactory: (...args: any[]) => Promise<SmsModuleOptions> | SmsModuleOptions
}
