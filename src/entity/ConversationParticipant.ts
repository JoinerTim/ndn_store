import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Staff } from "./Staff";
import { Customer } from "./Customer";
import { Conversation } from "./Conversation";
import { Employee } from "./Employee";


@Entity(addPrefix("conversation_participant"))
export class ConversationParticipant extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES


    // RELATIONS
    @ManyToOne(() => Staff, staff => staff.conversationParticipants)
    staff: Staff;

    @ManyToOne(() => Customer, customer => customer.conversationParticipants)
    customer: Customer;

    @ManyToOne(() => Employee)
    employee: Employee;

    @ManyToOne(() => Conversation, conversation => conversation.conversationParticipants)
    conversation: Conversation;


    // METHODS


} // END FILE
