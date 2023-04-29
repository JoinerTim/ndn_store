import { Args, Input, IO, Nsp, Socket, SocketService, SocketSession } from "@tsed/socketio";
import * as SocketIO from "socket.io";
import { Conversation } from "../entity/Conversation";
import { ConversationMessage } from "../entity/ConversationMessage";
import JWT, { AuthType } from "../middleware/auth/strategy/JWT";
import { getCurrentDateTime } from "../util/date";

export enum SocketEvent {
    Chat = 'CHAT', //xảy ra khi chat (staff, customer)
    StoreJoin = 'STORE_JOIN', //staff join (khi đã đăng nhập)
    CustomerJoin = 'CUSTOMER_JOIN', //customer join (khi có tồn tại conversation)
    CustomerLeave = 'CUSTOMER_LEAVE',//customer leave room
}
export interface SocketStoreJoinPayload {
    token: string
    storeId: number
}

export interface SocketCustomerJoinPayload {
    token: string;
    roomId: string;
}

export interface SocketChatPayload {
    token: string,
    message: ConversationMessage
    conversationId: number
    authType: AuthType
}

@SocketService("/socket")
export class MySocketService {
    @Nsp nsp: SocketIO.Namespace;

    private clients: Map<string, number> = new Map(); //<socketId,userId>
    private stores: Map<string, number> = new Map(); //<socketId,userId>
    private _rooms: Map<number, number[]> = new Map(); //<roomId, userId>

    get rooms() {
        this.logRooms()

        return this._rooms;
    }


    constructor(
        @IO private io: SocketIO.Server
    ) {

    }

    /**
     * Triggered the namespace is created
     */
    $onNamespaceInit(nsp: SocketIO.Namespace) {
        // console.log('onNamespaceInit:', nsp)
    }

    /**
     * Triggered when a new client connects to the Namespace.
     */
    $onConnection(@Socket socket: SocketIO.Socket, @SocketSession session: SocketSession) {
        console.log('onConnection socket.handshake:', socket.handshake)
        console.log('socket onConnection:', socket.id)
        console.log(`[${getCurrentDateTime()}] socket onConnection auth token:`, socket.handshake.auth)
    }

    @Input(SocketEvent.StoreJoin)
    async eventStoreJoin(@Args(0) data: SocketStoreJoinPayload, @Socket socket: Socket) {
        console.log('eventStoreJoin data:', data)
        if (!data) {
            console.error('*** eventStoreJoin NO DATA ***');
            return
        }

        if (!data.storeId) {
            console.error('*** eventStoreJoin NO StoreID ***');
            return
        }

        const storeId = this.authenticate(data.token, AuthType.Store)
        console.log(`[${getCurrentDateTime()}] storeJoin join storeId:`, storeId)


        if (storeId) {
            socket.join(`store-${data.storeId}`)
            this.stores.set(socket.id, storeId)
            console.log('socket store rooms', socket.rooms);
            socket.emit(SocketEvent.CustomerJoin, { status: 'ok' })
        } else {
            console.error('*** eventStoreJoin NO storeId ***');
        }
    }

    @Input(SocketEvent.CustomerLeave)
    async eventCustomerLeave(@Args(0) data: SocketCustomerJoinPayload, @Socket socket: Socket) {
        console.log(`[${getCurrentDateTime()}] eventCustomerLeave data:`, data)
        if (!data) {
            console.error('*** eventCustomerLeave NO Data ***');
            return
        }

        if (!data.roomId) {
            console.error('*** eventCustomerLeave NO RoomId ***');
            return
        }

        const customerId = this.authenticate(data.token)

        if (customerId) {
            socket.join(data.roomId)

            console.log('socket customer rooms', socket.rooms);
            socket.emit(SocketEvent.CustomerLeave, { status: 'ok' })
        } else {
            console.error('*** eventCustomerLeave NO CustomerId ***');
        }
    }

    @Input(SocketEvent.CustomerJoin)
    async eventCustomerJoin(@Args(0) data: SocketCustomerJoinPayload, @Socket socket: Socket) {
        console.log(`[${getCurrentDateTime()}] customerJoin join data:`, data)

        if (!data) {
            console.error('*** eventCustomerLeave NO Data ***');
            return
        }

        if (!data.roomId) {
            console.error('*** eventCustomerLeave NO RoomId ***');
            return
        }

        const customerId = this.authenticate(data.token)

        if (customerId) {
            this.clients.set(socket.id, customerId)
            socket.join(data.roomId)

            console.log('socket customer rooms', socket.rooms);
            socket.emit(SocketEvent.CustomerJoin, { status: 'ok' })
        } else {
            console.error('*** eventCustomerLeave NO CustomerId ***');
        }
    }

    @Input(SocketEvent.Chat)
    async eventChat(@Args(0) data: SocketChatPayload, @Socket socket: Socket) {
        console.log(`[${getCurrentDateTime()}] eventChat data:`, data);
        console.log('eventChat socket.rooms:', socket.rooms)

        if (!data) {
            console.error('*** eventCustomerLeave NO Data ***');
            return
        }

        if (!data.message) {
            console.error('*** eventCustomerLeave NO Message ***');
            return
        }

        let customerId = null, storeId = null;

        const {
            authType,
            message,
            conversationId
        } = data;

        switch (authType) {
            case AuthType.Customer:
                customerId = this.authenticate(data.token, AuthType.Customer)
                break;

            case AuthType.Store:
                storeId = this.authenticate(data.token, AuthType.Store)
                break;

            default:
                break;
        }

        //no auth
        if (!storeId && !customerId) {
            console.error('*** eventChat no auth ***');

            return;
        }

        const conversation = await Conversation.findOneOrThrowId(conversationId, {
            relations: ['store']
        }, '');

        const {
            store
        } = conversation

        switch (authType) {
            case AuthType.Store:
                const payload = { message, conversationId, storeId }
                console.log('eventChat send to conversation.roomId:', conversation.roomId)
                console.log('eventChat payload:', payload)
                this.nsp.to(conversation.roomId).emit(SocketEvent.Chat, payload)
                this.nsp.to(`store-${store.id}`).emit(SocketEvent.Chat, payload)
                break;

            case AuthType.Customer:
                this.nsp.to(`store-${store.id}`).emit(SocketEvent.Chat, { message, conversationId, customerId })
                break;
            default:
                break;
        }
    }

    private authenticate(token: string, authType: AuthType = AuthType.Customer) {
        let jwt = new JWT()
        let id = null;

        try {
            id = jwt.getAuthId(token, authType)

        } catch (error) {

        }

        return id
    }

    clearRoom(roomId: number) {
        this._rooms.delete(roomId)
    }

    private logRooms() {
        const rooms = Array.from(this._rooms, ([id, user]) => ({ id, user }))
        console.table(rooms)
    }


    /**
     * Triggered when a client disconnects from the Namespace.
     */
    async $onDisconnect(@Socket socket: SocketIO.Socket) {

        console.log('disconnect socket:', socket.rooms);

    }
}

