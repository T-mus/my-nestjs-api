import { ModuleMetadata } from '@nestjs/common'

export type SendGridModuleOptions = {
    apiKey: string
    sender: string
}

export type SendGridModuleAsyncOptions = Pick<ModuleMetadata, 'imports'> & {
    inject?: any[]
    useFactory: (...args: any[]) => Promise<SendGridModuleOptions> | SendGridModuleOptions
}

export type SendMailDto = {
    recipient: string
    subject: string
    text: string
    html?: string
}
