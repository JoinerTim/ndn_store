import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Product } from "./Product";
import { PromotionCampaign } from "./PromotionCampaign";
import { OrderDetail } from "./OrderDetail";

@Entity(addPrefix("promotion_campaign_detail"))
export class PromotionCampaignDetail extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: false })
    @Property()
    isGift: boolean; //true: assign quà tặng, false: sp đc chọn

    @Column({ default: 0 })
    @Property()
    quantity: number; //sl quà tặng

    @Column({ default: 0 })
    @Property()
    needed: number; //sl cần mua để tặng

    @Column({ default: 0, type: 'double' })
    @Property()
    discount: number; //giá trị giảm (vnđ)

    @Column({ default: 0, type: 'double' })
    @Property()
    discountPercent: number;

    @Column({ default: 0, type: 'double' })
    @Property()
    price: number; //giá gốc (vnđ)

    @Column({ default: 0, type: 'double' })
    @Property()
    finalPrice: number; //giá sau khi giảm (vnđ)

    @Column({ default: 0 })
    used: number; //sl đã dùng đối với quà tặng

    // RELATIONS
    @ManyToOne(() => Product, product => product.promotionCampaignDetails)
    product: Product;

    @ManyToOne(() => PromotionCampaign, promotionCampaign => promotionCampaign.promotionCampaignDetails)
    promotionCampaign: PromotionCampaign;

    @OneToMany(() => OrderDetail, orderDetail => orderDetail.promotionCampaignDetail)
    orderDetails: OrderDetail[];

    @OneToMany(() => OrderDetail, orderDetail => orderDetail.giftPromotionCampaignDetail)
    giftOrderDetails: OrderDetail[];

    // METHODS
    public async assignProduct(productId: number) {
        const product = await Product.findOneOrThrowId(productId, null, '')
        this.product = product
    }




} // END FILE
