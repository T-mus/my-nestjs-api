import { ConfigService } from '@nestjs/config'
import { MongooseModuleFactoryOptions } from '@nestjs/mongoose'
import mongoose from 'mongoose'

// prettier-ignore
export const getMongoConfig = async (configService: ConfigService): Promise<MongooseModuleFactoryOptions> => {
    const uri =
        `${configService.get<string>('MONGO_PROTOCOL', 'mongodb://')}` +
        `${configService.get('MONGO_LOGIN')}:${configService.get('MONGO_PASSWORD')}` +
        `@${configService.get('MONGO_HOST')}/${configService.get('MONGO_DB')}`

    mongoose.connection.once('open', () => {
        console.log('Successfully connected to the MongoDB database.')
    })
    mongoose.connection.on('error', (error) => {
        console.error('Error connecting to MongoDB:', error)
    })

    return { uri }
}
