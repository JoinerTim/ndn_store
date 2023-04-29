import { Entity, Column, ManyToOne } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Store } from "./Store";

@Entity(addPrefix("quick_message"))
export class QuickMessage extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ nullable: true, type: 'text' })
    @Property()
    content: string;

    // RELATIONS
    @ManyToOne(() => Store, store => store.quickMessages)
    store: Store;

    // METHODS

} // END FILE
