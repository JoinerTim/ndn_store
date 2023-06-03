import { Entity, Column, ManyToOne, OneToMany, OneToOne, JoinColumn } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { CouponCampaign, CouponConditionType, CouponDiscountType } from "./CouponCampaign";
import { Customer } from "./Customer";
import randomize from "randomatic"
import { COUPON_CODE } from "../enum";
import { OrderDetail } from "./OrderDetail";
import { Order } from "./Order";
import { BadRequest } from "@tsed/exceptions";

/**
 * coupon khách hàng nhận đc
 */
@Entity(addPrefix("customer_coupon"))
export class CustomerCoupon extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ unique: true })
    code: string;//mã coupon, k trùng

    @Column({ default: false })
    isUsed: boolean; //đã sử dụng

    @Column({ default: 0 })
    expiredAt: number;

    // RELATIONS
    @ManyToOne(() => CouponCampaign, couponCampaign => couponCampaign.customerCoupons)
    couponCampaign: CouponCampaign;

    @ManyToOne(() => Customer, customer => customer.customerCoupons)
    customer: Customer;

    @OneToMany(() => Order, order => order.customerCoupon)
    orders: Order[];


    @OneToOne(() => Order, giftedOrder => giftedOrder.giftedCustomerCoupon)
    @JoinColumn()
    giftedOrder: Order; //coupon dc tặng từ đơn hàng

    // METHODS
    async generateCode() {
        this.code = COUPON_CODE + this.customer.id + '-' + randomize('A0', 5);
    }

    public async assignCustomer(customerId: number) {
        const customer = await Customer.findOneOrThrowId(customerId, null, '')
        this.customer = customer
    }

    public async assignCouponCampaign(couponCampaignId: number) {
        const couponCampaign = await CouponCampaign.findOneOrThrowId(couponCampaignId, null, '')
        this.couponCampaign = couponCampaign
    }

    public async calcMoney(orderDetails: OrderDetail[], moneyProduct: number, order: Order, customerCoupon?: CustomerCoupon) {

        let moneyDiscount = 0 //tổng giá trị giảm trên đơn

        let discountProducts: OrderDetail[] = [] //ds sp đc giảm

        const customerCouponCampaign = await CustomerCoupon.createQueryBuilder('customerCoupon')
            .leftJoinAndSelect('customerCoupon.couponCampaign', 'couponCampaign')
            .leftJoinAndSelect('couponCampaign.couponCampaignDetails', 'couponCampaignDetails')
            .leftJoinAndSelect('couponCampaignDetails.product', 'product')
            .where('customerCoupon.code = :code', { code: customerCoupon.code })
            .getOne()

        if (!customerCouponCampaign) {
            throw new BadRequest("Coupon không tồn tại.")
        }

        switch (customerCouponCampaign.couponCampaign.conditionType) {
            case CouponConditionType.AllProduct: //gift, %, fixed
                discountProducts = orderDetails
                break;

            case CouponConditionType.SomeProduct: // gift, %
                discountProducts = orderDetails.filter(d => customerCouponCampaign.couponCampaign.couponCampaignDetails.some(e => {
                    return e.product.id == d.product.id
                }))
                moneyProduct = discountProducts.reduce((prev, cur) => prev + (cur.finalPrice * cur.quantity), 0)
                break;
        }
        console.log('coupon calcMoney discountProducts.length:', discountProducts.length, 'moneyProduct', moneyProduct)
        if (!discountProducts.length) {
            order.couponMsg = 'Danh sách sản phẩm không đúng để áp dụng coupon!'
            return 0;
        }

        switch (customerCouponCampaign.couponCampaign.discountType) {
            case CouponDiscountType.Fixed:
                moneyDiscount = customerCouponCampaign.couponCampaign.discountValue;
                break;

            case CouponDiscountType.Percent:
                if (customerCouponCampaign.couponCampaign.conditionType == CouponConditionType.SomeProduct) {
                    moneyProduct = discountProducts.reduce((prev, cur) => prev + (cur.finalPrice * cur.quantity), 0);
                    moneyDiscount = this.calcMoneyDiscountPercent(moneyProduct, customerCouponCampaign.couponCampaign)
                } else {
                    moneyDiscount = this.calcMoneyDiscountPercent(moneyProduct, customerCouponCampaign.couponCampaign)
                }
                break;

            case CouponDiscountType.Gift:
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

        if (customerCouponCampaign.couponCampaign.conditionValue && customerCouponCampaign.couponCampaign.conditionValue > moneyProduct) {
            order.couponMsg = 'Coupon: Giá trị đơn chưa đủ điều kiện'
            return 0;
        }

        return moneyDiscount
    }

    calcMoneyDiscountPercent(totalMoney: number, couponCampaign: CouponCampaign) {
        let moneyDiscount = 0;
        if (couponCampaign.discountType == CouponDiscountType.Percent) {
            if (totalMoney * couponCampaign.discountValue / 100 > couponCampaign.discountMaxValue) {
                moneyDiscount = couponCampaign.discountMaxValue
            } else {
                moneyDiscount = Math.floor(totalMoney * (couponCampaign.discountValue / 100));
            }
        }

        return moneyDiscount
    }


} // END FILE
