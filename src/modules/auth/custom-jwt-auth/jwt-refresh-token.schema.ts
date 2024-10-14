import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { User } from '../../users/users.schema'

@Schema({ timestamps: true, collection: 'jwt-refresh-tokens' })
export class JwtRefreshToken extends Document {
    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    userId: Types.ObjectId

    @Prop({ required: true })
    refreshToken: string

    @Prop({ required: true })
    deviceId: string
}

export const JwtRefreshTokenSchema = SchemaFactory.createForClass(JwtRefreshToken)
