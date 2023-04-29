import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Product } from "./Product";
import { Store } from "./Store";

/**
 * từ khóa tìm kiếm sp
 */
@Entity(addPrefix("product_tag"))
export class ProductTag extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: false })
    @Property()
    isHighlight: boolean;

    // RELATIONS
    @ManyToMany(() => Product, product => product.productTags)
    products: Product[];

    @ManyToOne(() => Store, store => store.productTags)
    store: Store;

    // METHODS


} // END FILE
