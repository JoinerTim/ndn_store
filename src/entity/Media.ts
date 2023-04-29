import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Product } from "./Product";
import { ProductRate } from "./ProductRate";
import { Store } from "./Store";

export enum MediaClassify {
    Library = 'LIBRARY',
    Product = 'PRODUCT'
}

export enum MediaType {
    Image = 'IMAGE',
    Video = 'VIDEO'
}

@Entity(addPrefix("media"))
export class Media extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: MediaClassify.Library, type: 'enum', enum: MediaClassify })
    classify: MediaClassify;

    @Column({ default: MediaType.Image, type: 'enum', enum: MediaType })
    @Property()
    type: MediaType;

    @Column({ default: 0 })
    @Property()
    pos: number; //vị trí

    @Column({ default: '' })
    @Property()
    url: string;

    @Column({ default: '' })
    @Property()
    thumbnail: string;

    // RELATIONS

    @ManyToOne(() => Product, p => p.images)
    product: Product;

    @ManyToMany(() => ProductRate, productRate => productRate.images)
    productRates: ProductRate[];

    @ManyToOne(() => Store)
    store: Store;

    // METHODS


} // END FILE
