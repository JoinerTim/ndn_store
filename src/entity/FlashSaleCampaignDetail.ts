import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Product } from "./Product";
import { FlashSaleCampaign } from "./FlashSaleCampaign";
import { OrderDetail } from "./OrderDetail";

@Entity(addPrefix("flash_sale_campaign_detail"))
export class FlashSaleCampaignDetail extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: 0 })
    @Property()
    sold: number;

    @Column({ default: 0 })
    @Property()
    pending: number; //sl đã bán, chưa hoàn thành đơn

    @Column({ default: 0, type: 'double' })
    @Property()
    price: number; //giá gốc sp

    @Column({ default: 0, type: 'double' })
    @Property()
    finalPrice: number; //giá sau khuyến mãi

    @Column({ default: 0 })
    @Property()
    stock: number; //sl tồn có thể bán

    // RELATIONS
    @ManyToOne(() => Product, product => product.flashSaleCampaignDetails)
    product: Product;

    @ManyToOne(() => FlashSaleCampaign, flashSaleCampaign => flashSaleCampaign.flashSaleCampaignDetails)
    flashSaleCampaign: FlashSaleCampaign;

    @OneToMany(() => OrderDetail, orderDetail => orderDetail.flashSaleCampaignDetail)
    orderDetails: OrderDetail[];

    // METHODS
    public async assignProduct(productId: number) {
        const product = await Product.findOneOrThrowId(productId, null, '')
        this.product = product
    }


} // END FILE
