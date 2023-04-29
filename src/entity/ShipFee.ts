import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { City } from "./City";
import { District } from "./District";
import { Store } from "./Store";

@Entity(addPrefix("ship_fee"))
export class ShipFee extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: 0 })
    @Property()
    price: number;

    @Column({ default: 0 })
    @Property()
    deliveryDay: number;//số ngày giao hàng

    // RELATIONS
    @ManyToOne(() => City, city => city.shipFees)
    city: City;

    @ManyToOne(() => District, district => district.shipFees)
    district: District;

    @ManyToOne(() => Store)
    store: Store;


    // METHODS


} // END FILE
