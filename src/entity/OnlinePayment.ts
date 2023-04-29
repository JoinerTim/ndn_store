import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { Order } from "./Order";
import { Store } from "./Store";

export enum EOnlinePayment {
    Deposit = 'DEPOSIT',
    Transfer = 'TRANSFER'
}

@Entity(addPrefix("online_payment"))
export class OnlinePayment extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES   
    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: '' })
    @Property()
    icon: string;

    @Column({ default: '' })
    @Property()
    ownerName: string;

    @Column({ default: '' })
    @Property()
    bankNumber: string;

    @Column({ enum: EOnlinePayment, type: 'enum' })
    @Property()
    type: EOnlinePayment;

    @Column({ default: '' })
    @Property()
    qrCode: string; //code hoặc hình ảnh QR


    // RELATIONS
    @OneToMany(() => Order, order => order.onlinePayment)
    orders: Order[];

    @ManyToOne(() => Store, store => store.onlinePayments)
    store: Store;


    // METHODS


} // END FILE
