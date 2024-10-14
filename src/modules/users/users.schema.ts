import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'
import { UserRole } from '../user-roles/user-roles.schema'

@Schema({ timestamps: true })
export class User extends Document<Types.ObjectId> {
    @Prop({ unique: true, required: true })
    email: string

    @Prop({ required: true })
    password: string

    @Prop({ required: false })
    phoneNumber: string

    @Prop({ type: [{ type: Types.ObjectId, ref: UserRole.name }] })
    roles: Types.ObjectId[]

    @Prop({ default: false })
    isAccountActivated: boolean

    @Prop()
    accountActivationToken: string

    @Prop()
    passwordResetToken: string

    @Prop()
    passwordResetExpires: Date
}

export const UserSchema = SchemaFactory.createForClass(User)
