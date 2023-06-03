import { Entity, Column, ManyToOne } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Order } from "./Order";

@Entity(addPrefix("order_product_tax"))
export class OrderProductTax extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: 0 })
    @Property()
    value: number;

    @Column({ default: 0, type: 'double' })
    @Property()
    moneyTax: number;

    // RELATIONS
    @ManyToOne(() => Order, order => order)
    order: Order;

    // METHODS


} // END FILE
