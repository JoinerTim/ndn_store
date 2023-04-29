import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Order } from "./Order";
import { Property } from "@tsed/schema";
import { ShipFee } from "./ShipFee";

@Entity(addPrefix("district"))
export class District extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @Column({ default: 0 })
    @Property()
    priority: number

    @Column({ default: '' })
    @Property()
    parentCode: string

    @Column({ default: '' })
    @Property()
    code: string

    @Column({ default: '' })
    @Property()
    pathWithType: string

    @Column({ default: '' })
    @Property()
    path: string

    @Column({ default: '' })
    @Property()
    nameWithType: string

    @Column({ default: '' })
    @Property()
    type: string

    @Column({ default: '' })
    @Property()
    slug: string

    @Column({ default: '' })
    @Property()
    name: string

    @Column({ default: '' })
    @Property()
    otherName: string;

    @Column({ default: false })
    @Property()
    isBlock: boolean

    @Column({ default: 1 })
    @Property()
    deliveryDay: number; //số ngày ước tính giao hàng

    // RELATIONS
    @OneToMany(() => ShipFee, shipFee => shipFee.district)
    shipFees: ShipFee[];



    // METHODS


} // END FILE
