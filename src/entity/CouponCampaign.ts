import { Entity, Column, OneToMany, ManyToOne, SelectQueryBuilder } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { CouponCampaignDetail } from "./CouponCampaignDetail";
import { CustomerCoupon } from "./CustomerCoupon";
import { PromotionCampaign } from "./PromotionCampaign";
import { OrderDetail } from "./OrderDetail";
import { Order } from "./Order";
import { Store } from "./Store";

export enum CouponCampaignType {
    DOB = 'DOB', //sinh nhật khách hàng
    FirstRegister = 'FIRST_REGISTER', //đk user lần đầu
    Event = 'EVENT', //event admin có thể tạo: giáng sinh, quốc khách, các dịp lễ, ...
    Gift = 'GIFT'
}

export enum CouponConditionType {
    AllProduct = 'ALL_PRODUCT',
    SomeProduct = 'SOME_PRODUCT',//1 vài mặt hàng đc chọn
}

export enum CouponDiscountType {
    Fixed = 'FIXED', //theo giá tiền cứng
    Percent = 'PERCENT', //theo % đơn hàng
    Gift = 'GIFT', //quà Quà ngoài hệ thống, không cần áp dụng trong phần
}

export enum CouponApplyFor {
    All = 'ALL',
    Some = 'SOME'
}

@Entity(addPrefix("coupon_campaign"))
export class CouponCampaign extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    code: string;

    @Column({ default: '' })
    @Property()
    name: string; //tên chiến dịch

    @Column({ type: 'enum', enum: CouponCampaignType })
    @Property()
    type: CouponCampaignType;

    @Column({ default: 0 })
    @Property()
    startAt: number;

    @Column({ default: 0 })
    @Property()
    endAt: number;

    @Column({ default: CouponApplyFor.All, type: 'enum', enum: CouponApplyFor })
    @Property()
    applyFor: CouponApplyFor;

    @Column({ default: 7 })
    @Property()
    expireDay: number; //Số ngày hết hạn sau khi cấp phát cho khách hàng

    @Column({ default: true })
    @Property()
    noExpired: boolean; //true: k thời hạn

    @Column({ type: 'enum', enum: CouponConditionType })
    @Property()
    conditionType: CouponConditionType;

    @Column({ type: 'enum', enum: CouponDiscountType })
    @Property()
    discountType: CouponDiscountType;

    @Column({ default: 0, type: 'double' })
    @Property()
    conditionValue: number; //giá trị đơn hàng tối thiếu có để áp dụng mã. Đối với CouponDiscountType.Fixed || CouponDiscountType.Percent.

    @Column({ default: false })
    @Property()
    isLimitValue: boolean; //true: giới hạn số tiền giảm đối với DiscountType.Percent

    @Column({ default: 0, type: 'double' })
    @Property()
    discountValue: number; //giá trị giảm (tiền). Đối với CouponDiscountType.Fixed || CouponDiscountType.Percent.

    @Column({ default: 0, type: 'double' })
    @Property()
    discountMaxValue: number; //giá trị giảm tối đa. Đối với CouponDiscountType.Percent. 0: k giới hạn

    @Column({ default: true })
    @Property()
    isEnabled: boolean; //true: chiến dịch đc bật

    // RELATIONS
    @OneToMany(() => CouponCampaignDetail, couponCampaignDetail => couponCampaignDetail.couponCampaign)
    couponCampaignDetails: CouponCampaignDetail[];

    @OneToMany(() => CustomerCoupon, customerCoupon => customerCoupon.couponCampaign)
    customerCoupons: CustomerCoupon[];

    @OneToMany(() => PromotionCampaign, promotionCampaign => promotionCampaign.couponCampaign)
    promotionCampaigns: PromotionCampaign[]; //coupon đc tặng từ các chương trình k.mãi

    @OneToMany(() => Order, order => order.couponCampaign)
    orders: Order[];

    @ManyToOne(() => Store, store => store.couponCampaigns)
    store: Store;

    // METHODS
    public async assignStore(storeId: number) {
        const store = await Store.findOneOrThrowId(storeId, null, '')
        this.store = store
    }


    /**
     * tính tiền giảm theo %
     */
    calcMoneyDiscountPercent(totalMoney: number) {
        let moneyDiscount = 0;
        if (this.discountType == CouponDiscountType.Percent) {
            if (totalMoney > this.discountMaxValue) {
                moneyDiscount = this.discountMaxValue
            } else {
                moneyDiscount = Math.floor(totalMoney * (this.discountValue / 100));
            }
        }

        return moneyDiscount
    }

    /**
     * 
     */
    async calcMoney(orderDetails: OrderDetail[], moneyProduct: number, order: Order, customerCoupon?: CustomerCoupon) {

        let moneyDiscount = 0 //tổng giá trị giảm trên đơn

        let discountProducts: OrderDetail[] = [] //ds sp đc giảm

        let customerCouponCampaign: CustomerCoupon
        if (customerCoupon) {
            customerCouponCampaign = await CustomerCoupon.createQueryBuilder('customerCoupon')
                .leftJoinAndSelect('customerCoupon.couponCampaign', 'couponCampaign')
                .leftJoinAndSelect('couponCampaign.couponCampaignDetails', 'couponCampaignDetails')
                .leftJoinAndSelect('couponCampaignDetails.product', 'product')
                .where('customerCoupon.code = :code', { code: customerCoupon.code })
                .getOne()
        }

        switch (this.conditionType) {
            case CouponConditionType.AllProduct: //gift, %, fixed
                discountProducts = orderDetails
                break;

            case CouponConditionType.SomeProduct: // gift, %
                discountProducts = orderDetails.filter(d => {
                    if (customerCouponCampaign) {
                        return customerCouponCampaign.couponCampaign.couponCampaignDetails.some(e => e.product.id == d.product.id)
                    } else {
                        return this.couponCampaignDetails.some(e => e.product.id == d.product.id)
                    }
                })
                moneyProduct = discountProducts.reduce((prev, cur) => prev + (cur.finalPrice * cur.quantity), 0)
                break;
        }

        console.log('coupon calcMoney discountProducts.length:', discountProducts.length, 'moneyProduct', moneyProduct)
        if (!discountProducts.length) {
            order.couponMsg = 'Danh sách sản phẩm không đúng để áp dụng coupon!'
            return 0;
        }

        switch (this.discountType) {
            case CouponDiscountType.Fixed:
                moneyDiscount = this.discountValue;
                break;

            case CouponDiscountType.Percent:
                if (this.conditionType == CouponConditionType.SomeProduct) {
                    moneyProduct = discountProducts.reduce((prev, cur) => prev + (cur.finalPrice * cur.quantity), 0);
                    moneyDiscount = this.calcMoneyDiscountPercent(moneyProduct)
                } else {
                    moneyDiscount = this.calcMoneyDiscountPercent(moneyProduct)
                }
                break;

            case CouponDiscountType.Gift:
                // đợi check lại
                // for (const campaignDetail of couponCampaignDetails) {
                //     if (campaignDetail.quantity + 1 > campaignDetail.stock) {
                //         throw new BadRequest(`Số lượng quà '${campaignDetail.product.name}' đã hết`);
                //     }

                //     const orderDetail = new OrderDetail()
                //     orderDetail.discount = campaignDetail.price;
                //     orderDetail.product = orderDetail.product
                //     orderDetail.isGift = true;
                //     orderDetail.couponCampaignDetail = campaignDetail
                // }
                break;

            default:
                break;
        }

        if (customerCouponCampaign) {
            if (customerCouponCampaign.couponCampaign.conditionValue && customerCouponCampaign.couponCampaign.conditionValue > moneyProduct) {
                order.couponMsg = 'Coupon: Giá trị đơn chưa đủ điều kiện'
                return 0;
            }
        } else if (this.conditionValue && this.conditionValue > moneyProduct) {
            order.couponMsg = 'Coupon: Giá trị đơn chưa đủ điều kiện'
            return 0;
        }

        return moneyDiscount
    }

} // END FILE
