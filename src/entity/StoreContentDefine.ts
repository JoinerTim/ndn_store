import { Entity, Column, ManyToOne } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import { ContentDefine } from "./ContentDefine";
import { Store } from "./Store";

@Entity(addPrefix("store_content_define"))
export class StoreContentDefine extends ContentDefine {
    constructor() {
        super()
    }

    // PROPERTIES


    // RELATIONS
    @ManyToOne(() => Store, store => store.storeContentDefines)
    store: Store;


    // METHODS


} // END FILE
