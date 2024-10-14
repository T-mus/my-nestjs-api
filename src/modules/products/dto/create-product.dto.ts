export class CreateProductDto {
    title: string

    subtitle: string

    price: number

    files?: Express.Multer.File[]
}
