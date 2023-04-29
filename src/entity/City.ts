import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { ShipFee } from "./ShipFee";


@Entity(addPrefix("city"))
export class City extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column()
    name: string

    @Column()
    slug: string;

    @Column()
    type: string

    @Column()
    nameWithType: string

    @Column()
    code: string

    @Column()
    @Property()
    priority: number

    // RELATIONS
    @OneToMany(() => ShipFee, shipFee => shipFee.city)
    shipFees: ShipFee[];


    // METHODS


} // END FILE
