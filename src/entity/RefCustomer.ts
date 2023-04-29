import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Customer } from "./Customer";
import { Order } from "./Order";
import { ProductRefPoint } from "./ProductRefPoint";

export enum RefCustomerType {
    Order = "ORDER",
    Register = "REGISTER"
}

@Entity(addPrefix("ref_customer"))
export class RefCustomer extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: 0, type: 'double' })
    @Property()
    totalPoint: number;

    @Column({ default: false })
    @Property()
    isConfirmed: boolean;

    @Column({ enum: RefCustomerType, type: 'enum' })
    @Property()
    type: RefCustomerType;

    productRefPoint: number

    productRefQuantity: number

    productTotalPoint: number

    productPrice: number

    // RELATIONS    
    @ManyToOne(() => Customer)
    customer: Customer;

    @ManyToOne(() => Order, order => order)
    order: Order;

    @ManyToOne(() => Customer)
    registerCustomer: Customer;

    @OneToMany(() => ProductRefPoint, productRefPoint => productRefPoint.refCustomer)
    productRefPoints: ProductRefPoint[];

    // METHODS
    public async assignCustomer(customerId: number) {
        const customer = await Customer.findOneOrThrowId(customerId, null, '')
        this.customer = customer
    }

} // END FILE
