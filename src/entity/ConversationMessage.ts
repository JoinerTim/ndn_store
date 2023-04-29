import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany, JoinTable } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { Customer } from "./Customer";
import { Conversation } from "./Conversation";
import { Order } from "./Order";
import { ConversationMessageType } from "../types/conversation";
import { Staff } from "./Staff";
import { UserType } from "../types/user";
import { Employee } from "./Employee";
import { Product } from "./Product";


@Entity(addPrefix("conversation_message"))
export class ConversationMessage extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: ConversationMessageType.Text, enum: ConversationMessageType, type: 'enum' })
    @Property()
    type: ConversationMessageType;

    @Column({ default: UserType.Customer, type: 'enum', enum: UserType })
    @Property()
    sendBy: UserType;

    @Column({ default: '' })
    @Property()
    privateId: string; //uuid v4

    @Column({ type: 'text', collation: 'utf8mb4_unicode_ci' })
    @Property()
    message: string;

    @Column({ default: '' })
    @Property()
    filename: string;

    @Column({ type: 'double', nullable: true })
    @Property()
    fileSize: number;

    @Property()
    productId: number

    // RELATIONS
    @ManyToOne(() => Customer)
    sender: Customer;

    @ManyToOne(() => Staff)
    staffSender: Staff;

    @ManyToOne(() => Employee)
    employee: Employee;

    @ManyToOne(() => Product, product => product.conversationMessages)
    product: Product;

    @ManyToOne(() => Conversation, conversation => conversation.conversationMessages)
    conversation: Conversation;

    @ManyToMany(() => Customer, customer => customer.seenConversationMessages)
    @JoinTable()
    seenCustomers: Customer[];

    @ManyToMany(() => Employee, employee => employee.seenConversationMessages)
    @JoinTable()
    seenEmployees: Employee[];

    // METHODS
    public async assignProduct(productId: number) {
        const product = await Product.findOneOrThrowId(productId, null, '')
        this.product = product
    }


} // END FILE
