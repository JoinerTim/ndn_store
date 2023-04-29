import { Entity, Column } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";

/**
 * công thức nấu ăn
 */
@Entity(addPrefix("cooking_recipe"))
export class CookingRecipe extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: '' })
    @Property()
    youtubeLink: string;

    // RELATIONS


    // METHODS


} // END FILE
