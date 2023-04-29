import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Customer } from "./Customer";
import { Product } from "./Product";
import { Store } from "./Store";

@Entity(addPrefix("liked_product"))
export class LikedProduct extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @ManyToOne(() => Customer, customer => customer.likedProducts)
    customer: Customer;

    @ManyToOne(() => Product, product => product.likedProducts)
    product: Product;

    @ManyToOne(() => Store, store => store.likeProducts)
    store: Store;



    // RELATIONS


    // METHODS


} // END FILE
