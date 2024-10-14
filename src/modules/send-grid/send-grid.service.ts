import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common'
import { SEND_GRID_MODULE_OPTIONS } from './send-drid.constants'
import { SendGridModuleOptions, SendMailDto } from './send-grid.types'
import * as sgMail from '@sendgrid/mail'
import * as ejs from 'ejs'

@Injectable()
export class SendGridService {
    constructor(@Inject(SEND_GRID_MODULE_OPTIONS) private options: SendGridModuleOptions) {
        sgMail.setApiKey(this.options.apiKey)
    }

    async sendMail(dto: SendMailDto): Promise<void> {
        const msg = {
            to: dto.recipient,
            from: this.options.sender,
            subject: dto.subject,
            text: dto.text,
            html: dto.html,
        }

        try {
            await sgMail.send(msg)
            console.log(`Email sent to ${dto.recipient}`)
        } catch (error) {
            console.error('Error sending email:', error)
            throw new InternalServerErrorException('Failed to send email')
        }
    }

    async renderHtmlFromTemplate(path: string, dynamicVars?: Record<string, any>): Promise<string> {
        return new Promise((resolve, reject) => {
            ejs.renderFile(path, dynamicVars, (error, result) => {
                if (error) {
                    reject(`Render HTML from template error: ${error}`)
                } else {
                    resolve(result)
                }
            })
        })
    }
}
