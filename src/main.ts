import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as cookieParser from 'cookie-parser'
import { MulterExceptionFilter } from './common/filters/multer-exception.filter'
import { WsAdapter } from '@nestjs/platform-ws'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function start() {
    const PORT = process.env.PORT || 5000
    const app = await NestFactory.create(AppModule)

    app.useLogger(['log', 'error', 'warn', 'debug', 'verbose'])
    app.use(cookieParser())
    app.useGlobalFilters(new MulterExceptionFilter())
    app.useWebSocketAdapter(new WsAdapter(app))

    const config = new DocumentBuilder()
        .setTitle('JWT Authorization API')
        .setDescription('API for custom JWT authorization')
        .setVersion('1.0')
        .addBearerAuth() // додати підтримку JWT токенів у Swagger
        .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('/api/docs', app, document)

    await app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
}
start()
