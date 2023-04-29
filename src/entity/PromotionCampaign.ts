import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { PromotionCampaignDetail } from "./PromotionCampaignDetail";
import { CouponCampaign } from "./CouponCampaign";
import { Order } from "./Order";
import { Store } from "./Store";
import { Employee } from "./Employee";


export enum PromotionConditionType {
    AllProduct = 'ALL_PRODUCT',
    SomeProduct = 'SOME_PRODUCT',//1 vài mặt hàng đc chọn
}


export enum PromotionDiscountType {
    ShipFee = 'SHIP_FEE',//Khuyến mãi miễn phí giao hàng trong bao nhiêu km
    Coupon = 'COUPON',//Khuyến mãi tặng Coupon áp dụng định mức ví dụ: mua 500k được tặng 1 coupon
    Percent = 'PERCENT',//giảm giá theo % của từng sp đc chọn
    Fixed = 'FIXED', //theo giá tiền cứng
    Gift = 'GIFT'//quà tặng kèm
}

/**
 * Chiến dịch khuyến mãi
 */
@Entity(addPrefix("promotion_campaign"))
export class PromotionCampaign extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    code: string;

    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: 0 })
    @Property()
    startAt: number; //unix startOf day

    @Column({ default: 0 })
    @Property()
    endAt: number; //unix endOf day

    @Column({ default: PromotionConditionType.AllProduct, type: 'enum', enum: PromotionConditionType })
    @Property()
    conditionType: PromotionConditionType;

    @Column({ default: true })
    @Property()
    noExpired: boolean; //true: k thời hạn

    @Column({ default: 0, type: 'double' })
    @Property()
    conditionValue: number; //giá trị đơn hàng có để áp dụng mã. Đối với CouponConditionType.Fixed || CouponConditionType.Percent.

    @Column({ default: 0, type: 'double' })
    @Property()
    discountValue: number; //giá trị giảm (tiền). Đối với CouponConditionType.Fixed || CouponConditionType.Percent.

    @Column({ default: false })
    @Property()
    isLimitValue: boolean; //true: giới hạn số tiền giảm đối với DiscountType.Percent

    @Column({ default: 0, type: 'double' })
    @Property()
    discountMaxValue: number; //giá trị giảm tối đa. Đối với CouponConditionType.Percent. 0: k giới hạn

    @Column({ default: 0, type: 'double' })
    @Property()
    distance: number; //số km tối đa khi là KM PromotionDiscountType.ShipFee

    @Column({ type: 'enum', enum: PromotionDiscountType })
    @Property()
    discountType: PromotionDiscountType;

    // RELATIONS
    @OneToMany(() => PromotionCampaignDetail, promotionCampaignDetail => promotionCampaignDetail.promotionCampaign)
    promotionCampaignDetails: PromotionCampaignDetail[];

    @ManyToOne(() => CouponCampaign, couponCampaign => couponCampaign.promotionCampaigns)
    couponCampaign: CouponCampaign; //coupon đc tặng khi áp dụng khuyến mãi

    @ManyToMany(() => Order, order => order.promotionCampaigns)
    orders: Order[];

    @ManyToOne(() => Store, store => store.promotionCampaigns)
    store: Store;

    @ManyToOne(() => Employee)
    deletedBy: Employee;

    // METHODS


    public async assignCouponCampaign(couponCampaignId: number) {
        const couponCampaign = await CouponCampaign.findOneOrThrowId(couponCampaignId, null, '')
        this.couponCampaign = couponCampaign
    }

    public async assignStore(storeId: number) {
        const store = await Store.findOneOrThrowId(storeId, null, '')
        this.store = store
    }

} // END FILE
