import { Entity, Column, OneToMany, ManyToOne } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix, getCurrentTimeInt } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Product } from "./Product";
import { Order } from "./Order";
import { ProductVariation } from "./ProductVariation";
import { FlashSaleCampaignDetail } from "./FlashSaleCampaignDetail";
import { CouponCampaignDetail } from "./CouponCampaignDetail";
import { PromotionCampaignDetail } from "./PromotionCampaignDetail";
import { PromotionCampaign } from "./PromotionCampaign";
import { Customer } from "./Customer";

@Entity(addPrefix("order_detail"))
export class OrderDetail extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string; //diễn giải

    @Column({ type: 'double', default: 0 })
    @Property()
    price: number //giá gốc

    @Column({ default: 0, type: 'double' })
    @Property()
    finalPrice: number;//đơn giá sau giảm giá

    @Column({ default: 0, type: 'double' })
    @Property()
    discountFlashSale: number; //giảm tiền trên

    @Column({ default: 0, type: 'double' })
    @Property()
    discount: number; //giảm trên promotion

    @Column({ default: 0, type: 'double' })
    @Property()
    discountCoupon: number; //giảm trên coupon

    @Column({ default: false })
    @Property()
    isGift: boolean;//true: hàng tặng, khuyến mãi

    @Column({ default: 1 })
    @Property()
    quantity: number

    @Column({ default: 0, type: 'double' })
    @Property()
    savingPoint: number; //

    //custom
    isExpiredPromotion: boolean; //true: hết hạn khuyến mãi
    isExpiredFlashSale: boolean; //true: hết hạn flash sale
    isProductDeleted: boolean; //true: sp bị xóa khỏi hệ thống
    isExpiredGift: boolean; //true: hết hạn k.mãi tặng kèm
    isOutOfStockFlashSale: boolean; //true: vượt quá sl bán của flash sale


    // RELATIONS
    @ManyToOne(() => Product, product => product.orderDetails)
    product: Product;

    @ManyToOne(() => Order, order => order.details)
    order: Order;

    @ManyToOne(() => Order, orderGift => orderGift.gifts)
    orderGift: Order;

    @OneToMany(() => OrderDetail, children => children.parent)
    children: OrderDetail[];

    @ManyToOne(() => OrderDetail, parent => parent.children)
    parent: OrderDetail;

    @ManyToOne(() => ProductVariation, productVariation => productVariation.orderDetails)
    productVariation: ProductVariation;

    @ManyToOne(() => FlashSaleCampaignDetail, flashSaleCampaignDetail => flashSaleCampaignDetail.orderDetails)
    flashSaleCampaignDetail: FlashSaleCampaignDetail;

    @ManyToOne(() => CouponCampaignDetail, couponCampaignDetail => couponCampaignDetail.orderDetails)
    couponCampaignDetail: CouponCampaignDetail;

    @ManyToOne(() => PromotionCampaignDetail, promotionCampaignDetail => promotionCampaignDetail.orderDetails)
    promotionCampaignDetail: PromotionCampaignDetail; //khuyến mãi giảm giá

    @ManyToOne(() => PromotionCampaignDetail, promotionCampaignDetail => promotionCampaignDetail.giftOrderDetails)
    giftPromotionCampaignDetail: PromotionCampaignDetail; //khuyến mãi tặng kèm

    @ManyToOne(() => Customer)
    refCustomer: Customer;

    // METHODS
    public async assignRefCustomer(refCustomerId: number) {
        const refCustomer = await Customer.findOneOrThrowId(refCustomerId, null, '')
        this.refCustomer = refCustomer
    }

    public async assignProduct(productId: number) {
        const product = await Product.findOneOrThrowId(productId, {
        }, '')
        this.product = product
    }

    public async assignPromotionCampaignDetail(promotionCampaignDetailId: number) {
        const promotionCampaignDetail = await PromotionCampaignDetail.findOneOrThrowId(promotionCampaignDetailId, {
            relations: ['promotionCampaign', 'product']
        }, '')
        this.promotionCampaignDetail = promotionCampaignDetail;

        const { promotionCampaign } = promotionCampaignDetail
        this.isExpiredPromotion = false;
        if (promotionCampaign.endAt < getCurrentTimeInt() || promotionCampaign.isDeleted) {
            this.isExpiredPromotion = true;
        }
    }

    public async assignGiftPromotionCampaignDetail(promotionCampaignDetailId: number) {
        const promotionCampaignDetail = await PromotionCampaignDetail.findOneOrThrowId(promotionCampaignDetailId, {
            relations: ['promotionCampaign', 'product']
        }, '')

        this.isExpiredGift = false;
        this.giftPromotionCampaignDetail = promotionCampaignDetail;

        const { promotionCampaign } = promotionCampaignDetail
        if (promotionCampaign.endAt < getCurrentTimeInt() || promotionCampaign.isDeleted) {
            this.isExpiredGift = true;
        }

        const promotionCampaignFind = await PromotionCampaign.findOneOrThrowId(promotionCampaign.id, {
            relations: ['promotionCampaignDetails', 'promotionCampaignDetails.product']
        }, '');

        promotionCampaignDetail.promotionCampaign = promotionCampaignFind;
    }

    public async assignFlashSaleCampaignDetail(flashSaleCampaignDetailId: number) {
        const flashSaleCampaignDetail = await FlashSaleCampaignDetail.findOneOrThrowId(flashSaleCampaignDetailId, {
            relations: ['flashSaleCampaign']
        }, '')
        this.flashSaleCampaignDetail = flashSaleCampaignDetail
        this.isExpiredFlashSale = false;
        const { flashSaleCampaign } = flashSaleCampaignDetail
        if (flashSaleCampaign.endAt < getCurrentTimeInt() || flashSaleCampaign.isDeleted) {
            this.isExpiredFlashSale = true;
        }
    }


    public async assignProductVariation(productVariationId: number) {
        const productVariation = await ProductVariation.findOneOrThrowId(productVariationId, null, '')
        this.productVariation = productVariation
    }

} // END FILE
