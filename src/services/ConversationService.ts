// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { v4 } from "uuid";


// IMPORT CUSTOM
import { Conversation } from "../entity/Conversation";
import { ConversationMessage } from "../entity/ConversationMessage";
import { ConversationParticipant } from "../entity/ConversationParticipant";
import { Customer } from "../entity/Customer";
import { Employee } from "../entity/Employee";
import { OneSignal } from "../entity/OneSignal";
import { Staff } from "../entity/Staff";
import { Store } from "../entity/Store";
import { ConversationMessageType } from "../types/conversation";
import { UserType } from "../types/user";
import { Firebase } from "../util/firebase";
import { OneSignalUtil } from "../util/oneSignal";


export interface conversationMessageParams {
    deviceId?: string,
    version?: string,
    conversationId: number,
    page?: number,
    limit?: number,
    storeId: number,
}

@Service()
export class ConversationService {

    async create({
        status,
        owner,
        target,
        store,
        roomId
    }: Partial<Conversation>) {
        const conversation = new Conversation();
        conversation.owner = owner;
        conversation.store = store;
        conversation.status = status;
        conversation.target = target;
        conversation.roomId = roomId;

        await conversation.save()
        return conversation;
    }

    async fixSeenMessage() {
        const messages = await ConversationMessage.createQueryBuilder('conversationMessage')
            .leftJoinAndSelect('conversationMessage.conversation', 'conversation')
            .leftJoinAndSelect('conversation.owner', 'owner')
            .leftJoinAndSelect('conversation.target', 'target')
            .leftJoinAndSelect('conversationMessage.seenCustomers', 'seenCustomers')
            .where('conversation.isDeleted = 0')
            .getMany()

        for (const message of messages) {
            message.seenCustomers = [message.conversation.owner, message.conversation.target]
            await message.save()
        }

    }

    async fixLastMessage() {
        const conversations = await Conversation.find()
        for (const conversation of conversations) {
            const message = await ConversationMessage.createQueryBuilder('conversationMessage')
                .leftJoinAndSelect('conversationMessage.sender', 'sender')
                .where('conversationMessage.conversationId = :conversationId', { conversationId: conversation.id })
                .orderBy('conversationMessage.id', 'DESC')
                .getOne()

            if (message) {
                conversation.lastCustomer = message.sender
                conversation.lastMessage = message.message
                conversation.lastMessageType = message.type
                await conversation.save()
            }
        }
    }

    /**
     * tạo hoặc get nếu đã tồn tại
     */
    async createOrGetConversation({
        owner, store
    }: { owner: Customer, store: Store }) {
        let conversation = await Conversation.findOne({
            where: {
                owner,
                store,
                isDeleted: false
            }
        });

        if (!conversation) {
            conversation = await this.create({
                owner,
                store,
                roomId: v4()
            })

            const conversationParticipant = new ConversationParticipant()
            conversationParticipant.customer = owner;
            conversationParticipant.conversation = conversation
            await conversationParticipant.save()
        }

        return conversation
    }

    async sendMessage({
        message,
        conversationId,
        customerSender,
        staff,
        sendBy,
        employee
    }: {
        message: ConversationMessage,
        conversationId: number,
        customerSender?: Customer,
        staff?: Staff,
        employee?: Employee,
        sendBy: UserType
    }) {
        const conversation = await Conversation.findOneOrThrowId(conversationId, {
            relations: ['owner', 'store']
        }, '');

        const {
            store
        } = conversation

        message.conversation = conversation;
        message.sendBy = sendBy;
        message.employee = employee
        message.sender = customerSender;
        message.staffSender = staff;

        if (message.productId) {
            await message.assignProduct(message.productId)
        }

        await message.save();

        conversation.lastCustomer = customerSender
        conversation.lastEmployee = employee
        conversation.lastStaff = staff
        conversation.lastMessage = message.message
        conversation.lastMessageType = message.type;

        //check participant
        if (staff) {
            let conversationParticipant = await ConversationParticipant.findOne({
                where: {
                    conversation,
                    staff
                }
            })

            if (!conversationParticipant) {
                conversationParticipant = new ConversationParticipant()
                conversationParticipant.conversation = conversation;
                conversationParticipant.staff = staff;
                await conversationParticipant.save()
            }
        }

        //check employee
        if (employee) {
            let conversationParticipant = await ConversationParticipant.findOne({
                where: {
                    conversation,
                    employee
                }
            })

            if (!conversationParticipant) {
                conversationParticipant = new ConversationParticipant()
                conversationParticipant.conversation = conversation;
                conversationParticipant.employee = employee;
                await conversationParticipant.save()
            }
        }

        //check customerSender
        if (customerSender) {
            let conversationParticipant = await ConversationParticipant.findOne({
                where: {
                    conversation,
                    customer: customerSender
                }
            })

            if (!conversationParticipant) {
                conversationParticipant = new ConversationParticipant()
                conversationParticipant.conversation = conversation;
                conversationParticipant.customer = customerSender;
                await conversationParticipant.save()
            }
        }


        await conversation.save();

        const receiveCustomer = conversation.owner

        const { type } = message;
        let body = '';
        switch (type) {
            case ConversationMessageType.Text:
                body = message.message
                break;


            case ConversationMessageType.Image:
                body = 'Bạn vừa nhận hình ảnh mới'
                break;
            case ConversationMessageType.Product:
                body = 'Bạn vừa nhận được tin nhắn mới về sản phẩm'
            default:
                break;
        }

        //khách chat
        if (customerSender) {

            const title = `Có tin nhắn mới từ khách hàng`
            if (staff) {
                let where = `staff.isBlocked = 0 AND staff.isDeleted = 0 AND (staff.storeId is null OR staff.storeId = :storeId)`
                const staffs = await OneSignal.createQueryBuilder('oneSignal')
                    .innerJoinAndSelect('oneSignal.staff', 'staff')
                    .where(where, {
                        storeId: store.id
                    })
                    .getMany()

                OneSignalUtil.pushNotification({
                    heading: title,
                    content: body,
                    oneSignalPlayerIds: staffs.map(e => e.oneSignalId),
                    data: {
                        conversationId: conversation.id + '',
                        message: message.message,
                        messageType: message.type,
                        type: 'CHAT'
                    },
                    userType: 'admin'
                })
            } else if (store) {
                let where = `employee.isBlocked = 0 AND employee.isDeleted = 0 AND employee.storeId = :storeId`
                const employees = await OneSignal.createQueryBuilder('oneSignal')
                    .innerJoinAndSelect('oneSignal.employee', 'employee')
                    .where(where, {
                        storeId: store.id
                    })
                    .getMany()

                OneSignalUtil.pushNotification({
                    heading: title,
                    content: body,
                    oneSignalPlayerIds: employees.map(e => e.oneSignalId),
                    data: {
                        conversationId: conversation.id + '',
                        message: message.message,
                        messageType: message.type,
                        type: 'CHAT'
                    },
                    userType: 'store',
                    pathUrl: `/conversations?storeId=${store.id}&conversationId=${conversation.id}`
                })
            }

        }
        //admin chat
        else if (staff) {
            Firebase.send({
                message: {
                    title: `Có tin nhắn mới từ admin ${staff.name.trim()}`,
                    body,
                    data: {
                        conversationId: conversation.id + '',
                        message: message.message,
                        messageType: message.type,
                        type: 'CHAT'
                    }
                },
                tokens: [
                    {
                        token: receiveCustomer.fcmToken,
                        badgeCount: receiveCustomer.notificationBadgeCount
                    }
                ]
            });
        }
        //store chat
        else if (employee) {
            Firebase.send({
                message: {
                    title: `Có tin nhắn mới từ cửa hàng`,
                    body,
                    data: {
                        conversationId: conversation.id + '',
                        message: message.message,
                        messageType: message.type,
                        type: 'CHAT'
                    }
                },
                tokens: [
                    {
                        token: receiveCustomer.fcmToken,
                        badgeCount: receiveCustomer.notificationBadgeCount
                    }
                ]
            });
        }

        return message
    }

} //END FILE
