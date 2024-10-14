import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets'
import { Server, WebSocket } from 'ws'

@WebSocketGateway()
export class ProductsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server

    afterInit(server: Server) {
        console.log('The WebSocket server started')
    }

    handleConnection(client: WebSocket) {
        console.log('Клієнт підключився')

        client.on('message', (message: string) => {
            const textMessage = message.toString()
            console.log('Отримано повідомлення від клієнта:', textMessage)

            client.send('Ваше повідомлення отримано: ' + textMessage)
        })
    }

    handleDisconnect(client: WebSocket) {
        console.log('The client disconnected')
    }
}
