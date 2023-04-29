import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Customer } from "./Customer";
import moment from "moment";
import randomatic from "randomatic";
import { Store } from "./Store";

@Entity(addPrefix("otp"))
export class Otp extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    code: string;

    @Column({ default: false })
    @Property()
    isUsed: boolean;

    @Column({ default: '' })
    @Property()
    phone: string;

    // RELATIONS
    @ManyToOne(() => Customer, customer => customer.otp)
    customer: Customer;

    @ManyToOne(() => Store)
    store: Store;


    // METHODS
    isExpired() {
        return moment().diff(moment.unix(this.createdAt,), 'minutes') > 5
    }

    generateCode() {
        this.code = randomatic('0', 6);
    }


} // END FILE
