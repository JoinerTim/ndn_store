import { Entity, Column, OneToMany, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Customer } from './Customer'
import { Notification } from './Notification'
import { Store } from "./Store";

@Entity(addPrefix("group_customer"))
export class GroupCustomer extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ nullable: true, type: 'text' })
    @Property()
    description: string;

    // RELATIONS
    @ManyToMany(() => Customer, customer => customer.groupCustomers)
    @JoinTable()
    customers: Customer[];

    // METHODS
    @OneToMany(() => Notification, notification => notification.groupCustomer)
    notifications: Notification[];

    @ManyToOne(() => Store, store => store.groupCustomers)
    store: Store;

} // END FILE
