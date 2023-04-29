import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { Order } from "./Order";
import { OrderStatus } from "../types/order";
import { Staff } from "./Staff";
import { Customer } from "./Customer";

export enum OrderLogType {
    CreateOrder = 'CREATE_ORDER',
    UpdateStatus = 'UPDATE_STATUS',
    UpdateOrder = 'UPDATE_ORDER',
    RefundPayment = 'REFUND_PAYMENT'

}

export enum OrderLogCreateFrom {
    Admin = 'ADMIN',
    TopPos = 'TOP_POS'
}

@Entity(addPrefix("order_log"))
export class OrderLog extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: OrderLogCreateFrom.Admin, type: 'enum', enum: OrderLogCreateFrom })
    createFrom: OrderLogCreateFrom;

    @Column({ default: OrderLogType.CreateOrder, type: 'enum', enum: OrderLogType })
    @Property()
    type: OrderLogType;

    @Column({ nullable: true, type: 'enum', enum: OrderStatus })
    @Property()
    status: OrderStatus;

    @Column({ type: 'text', nullable: true })
    @Property()
    prevOrderJson: string;

    @Column({ type: 'text', nullable: true })
    @Property()
    currentOrderJson: string;


    // RELATIONS
    @ManyToOne(() => Order, order => order.orderLogs)
    order: Order;

    @ManyToOne(() => Staff)
    staff: Staff;

    @ManyToOne(() => Customer)
    customer: Customer;

    // METHODS


} // END FILE
