import { Entity, Column, OneToMany, ManyToOne } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { Customer } from "./Customer";
import { Store } from "./Store";

@Entity(addPrefix("customer_rank"))
export class CustomerRank extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: '' })
    @Property()
    description: string;

    @Column({ default: '' })
    @Property()
    image: string;

    @Column({ default: '' })
    @Property()
    icon: string;

    @Column({ default: 0, type: 'double' })
    @Property()
    reachedPoint: number; //số điểm cần đạt đến hạng

    // RELATIONS
    @OneToMany(() => Customer, customer => customer.customerRank)
    customers: Customer[];

    @ManyToOne(() => Store, store => store.customerRanks)
    store: Store;

    // METHODS


} // END FILE
