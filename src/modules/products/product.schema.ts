import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

@Schema({ timestamps: true })
export class Product extends Document<Types.ObjectId> {
    @Prop({ unique: true, required: true })
    title: string

    @Prop({ unique: true, required: true })
    subtitle: string

    @Prop({ required: true })
    price: number

    @Prop({ required: false })
    files: string[]
}

export const ProductSchema = SchemaFactory.createForClass(Product)
