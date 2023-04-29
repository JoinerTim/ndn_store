import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Product } from "./Product";
import { Customer } from "./Customer";
import { Order } from "./Order";
import { Media } from "./Media";

@Entity(addPrefix("product_rate"))
export class ProductRate extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '', collation: 'utf8mb4_unicode_ci' })
    @Property()
    content: string;

    @Column({ default: 0, type: 'double' })
    @Property()
    star: number;

    // RELATIONS
    @ManyToOne(() => Product)
    product: Product;

    @ManyToOne(() => Customer)
    customer: Customer;

    @ManyToMany(() => Media, media => media.productRates)
    @JoinTable()
    images: Media[];

    @ManyToOne(() => Order, order => order.productRates)
    order: Order;

    // METHODS
    public async assignImages(images: string[]) {
        const media: Media[] = []
        for (const img of images) {
            const m = new Media();
            m.url = img;

            media.push(m)
        }
        this.images = media
    }


} // END FILE
