import { Entity, Column, ManyToOne } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Store } from "./Store";

@Entity(addPrefix("branch"))
export class Branch extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: false })
    @Property()
    isCentral: boolean; //chi nhánh trung tâm


    // RELATIONS
    @ManyToOne(() => Store, store => store.branches)
    store: Store;


    // METHODS


} // END FILE
