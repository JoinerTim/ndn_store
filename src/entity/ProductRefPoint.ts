import { Entity, Column, ManyToOne } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { RefCustomer } from "./RefCustomer";
import { Product } from "./Product";

export enum ProductRefPointType {
    Category = "CATEGORY",
    Product = "PRODUCT"
}

@Entity(addPrefix("product_ref_point"))
export class ProductRefPoint extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: 0 })
    @Property()
    refPoint: number;

    @Column({ default: 0, type: 'double' })
    @Property()
    price: number;

    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ type: "enum", enum: ProductRefPointType, default: ProductRefPointType.Product })
    @Property()
    type: ProductRefPointType;

    // RELATIONS    
    @ManyToOne(() => RefCustomer, refCustomer => refCustomer.productRefPoints)
    refCustomer: RefCustomer;

    @ManyToOne(() => Product, product => product.productRefPoints)
    product: Product;
    // METHODS

    public async assignProduct(productId: number) {
        const product = await Product.findOneOrThrowId(productId, null, '')
        this.product = product
    }

    public async assignRefCustomer(refCustomerId: number) {
        const refCustomer = await RefCustomer.findOneOrThrowId(refCustomerId, null, '')
        this.refCustomer = refCustomer
    }


} // END FILE
