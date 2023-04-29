import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Customer } from "./Customer";
import { ConversationMessage } from "./ConversationMessage";
import { Property } from "@tsed/schema";
import { ConversationMessageType } from "../types/conversation";
import { Staff } from "./Staff";
import { Store } from "./Store";
import { ConversationParticipant } from "./ConversationParticipant";
import { UserType } from "../types/user";
import { Employee } from "./Employee";

export enum ConversationStatus {
    Open = 'OPEN',
    Close = 'CLOSE'
}


@Entity(addPrefix("conversation"))
export class Conversation extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ type: 'enum', enum: ConversationStatus, default: ConversationStatus.Open })
    status: ConversationStatus;

    @Column({ default: '' })
    roomId: string; //uuid v4

    @Column({ default: '', collation: 'utf8mb4_unicode_ci' })
    @Property()
    lastMessage: string;

    @Column({ nullable: true, type: 'enum', enum: ConversationMessageType })
    @Property()
    lastMessageType: ConversationMessageType;

    @Column({ default: UserType.Customer, type: 'enum', enum: UserType })
    @Property()
    lastSendBy: UserType;

    // RELATIONS
    @ManyToOne(() => Customer, customer => customer.ownerConversations)
    owner: Customer;

    @ManyToOne(() => Customer, customer => customer)
    target: Customer;

    @ManyToOne(() => Staff, staff => staff.conversations)
    staff: Staff;

    @ManyToOne(() => Employee)
    employee: Employee;

    @OneToMany(() => ConversationMessage, conversationMessage => conversationMessage.conversation)
    conversationMessages: ConversationMessage[];

    @ManyToOne(() => Customer)
    lastCustomer: Customer;

    @ManyToOne(() => Staff)
    lastStaff: Staff;

    @ManyToOne(() => Employee)
    lastEmployee: Employee;

    @ManyToOne(() => Store, store => store.conversations)
    store: Store;

    @OneToMany(() => ConversationParticipant, conversationParticipant => conversationParticipant.conversation)
    conversationParticipants: ConversationParticipant[];

    // METHODS


} // END FILE
