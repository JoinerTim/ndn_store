import { Entity, Column, OneToMany, ManyToOne } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Product } from "./Product";
import { Store } from "./Store";

@Entity(addPrefix("product_tax"))
export class ProductTax extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: 0, type: 'double' })
    @Property()
    value: number;

    @Column({ default: '' })
    @Property()
    description: string;

    // RELATIONS
    @OneToMany(() => Product, product => product.productTax)
    products: Product[];

    @ManyToOne(() => Store, store => store)
    store: Store;

    // METHODS



} // END FILE
