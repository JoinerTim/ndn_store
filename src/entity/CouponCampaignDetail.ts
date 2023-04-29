import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { CouponCampaign } from "./CouponCampaign";
import { Product } from "./Product";
import { OrderDetail } from "./OrderDetail";

@Entity(addPrefix("coupon_campaign_detail"))
export class CouponCampaignDetail extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: 0 })
    quantity: number; //

    @Column({ default: 0 })
    stock: number; //

    @Column({ default: 0, type: 'double' })
    @Property()
    price: number; //đơn giá gốc

    @Column({ default: 0, type: 'double' })
    @Property()
    finalPrice: number; //đơn giá sau k.mãi

    // RELATIONS
    @ManyToOne(() => CouponCampaign, couponCampaign => couponCampaign.couponCampaignDetails)
    couponCampaign: CouponCampaign;

    @ManyToOne(() => Product, product => product.couponCampaignDetails)
    product: Product;

    @OneToMany(() => OrderDetail, orderDetail => orderDetail.couponCampaignDetail)
    orderDetails: OrderDetail[];

    // METHODS
    public async assignProduct(productId: number) {
        const product = await Product.findOneOrThrowId(productId, null, '')
        this.product = product
    }


} // END FILE
