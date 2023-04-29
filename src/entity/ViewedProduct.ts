import { Entity, Column, ManyToOne } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Customer } from "./Customer";
import { Product } from "./Product";
import { Store } from "./Store";

@Entity(addPrefix("viewed_product"))
export class ViewedProduct extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: 0 })
    totalView: number;

    // RELATIONS
    @ManyToOne(() => Customer, customer => customer.viewedProducts)
    customer: Customer;

    @ManyToOne(() => Product, product => product.viewedProducts)
    product: Product;

    @ManyToOne(() => Store, store => store.viewedProducts)
    store: Store;

    // METHODS


} // END FILE
