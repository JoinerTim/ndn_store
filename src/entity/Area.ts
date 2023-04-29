import { Column, Entity, OneToMany } from "typeorm";
import { Property } from "@tsed/schema"

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Store } from "./Store";

@Entity(addPrefix("area"))
export class Area extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string;


    // RELATIONS
    @OneToMany(() => Store, store => store.area)
    stores: Store[];


    // METHODS


} // END FILE
