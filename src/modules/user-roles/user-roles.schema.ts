import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true, collection: 'user-roles' })
export class UserRole extends Document {
    @Prop()
    value: string

    @Prop()
    description: string
}

export const UserRoleSchema = SchemaFactory.createForClass(UserRole)
