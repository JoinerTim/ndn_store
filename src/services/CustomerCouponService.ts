// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { CronJob } from "cron";
import moment from "moment-timezone";
import { CouponCampaign, CouponCampaignType } from "../entity/CouponCampaign";
import { Customer } from "../entity/Customer";


// IMPORT CUSTOM
import { CustomerCoupon } from "../entity/CustomerCoupon";
import { Order } from "../entity/Order";
import { PromotionCampaign, PromotionDiscountType } from "../entity/PromotionCampaign";
import { getCurrentTimeInt } from "../util/helper";
import { NotificationService } from "./NotificationService";
import { Store } from "../entity/Store";

interface CustomerCouponQuery {
    page: number;
    limit: number
    search?: string
    customerId?: number
    storeId?: number
    isUsed?: boolean
    isExpired?: boolean
}

@Service()
export class CustomerCouponService {

    constructor(
        private notificationService: NotificationService
    ) {

    }

    $onReady() {
        new CronJob('0 7 * * *', () => {
            //run at 07:00 am
            this.handleWhenDobCustomer()
        })
    }

    async create({
        customer,
        couponCampaign,
        expiredAt,
        giftedOrder
    }: Partial<CustomerCoupon>) {
        const customerCoupon = new CustomerCoupon()
        customerCoupon.couponCampaign = couponCampaign
        customerCoupon.customer = customer;
        customerCoupon.expiredAt = expiredAt || moment.unix(couponCampaign.endAt).endOf('day').unix()
        customerCoupon.giftedOrder = giftedOrder

        customerCoupon.generateCode();
        await customerCoupon.save()
        return customerCoupon
    }

    async getManyAndCount({
        page,
        limit,
        search = '',
        customerId,
        storeId,
        isUsed,
        isExpired
    }: CustomerCouponQuery) {
        let where = `customerCoupon.isDeleted = false AND customerCoupon.code LIKE :search AND couponCampaign.isDeleted = false`;
        const currentAt = getCurrentTimeInt()

        if (customerId) {
            where += ` AND customer.id = :customerId`
        }

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        if (typeof isUsed == 'boolean') {
            where += ' AND customerCoupon.isUsed = :isUsed'
        }

        if (isExpired === true) {
            where += ` AND couponCampaign.endAt < ${currentAt}`
        } else if (isExpired === false) {
            where += ` AND couponCampaign.endAt >= ${currentAt}`
        }

        const [customerCoupons, total] = await CustomerCoupon.createQueryBuilder('customerCoupon')
            .leftJoinAndSelect('customerCoupon.customer', 'customer')
            .leftJoinAndSelect('customerCoupon.couponCampaign', 'couponCampaign')
            .leftJoinAndSelect('couponCampaign.store', "store")
            .leftJoinAndSelect('couponCampaign.couponCampaignDetails', 'couponCampaignDetail')
            .leftJoinAndSelect('couponCampaignDetail.product', 'product')
            .where(where, { search: `%${search}%`, isUsed, customerId, storeId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('customerCoupon.id', 'DESC')
            .getManyAndCount()

        return { customerCoupons, total }
    }

    async getOne(customerCouponId: number) {
        const customerCoupon = await CustomerCoupon.findOneOrThrowId(customerCouponId, {
            relations: ['customer', 'couponCampaign', 'couponCampaign.couponCampaignDetails', 'couponCampaign.couponCampaignDetails.product']
        })
        return customerCoupon
    }

    /**
     * Tặng coupon khi đơn hàng có khuyến mãi dạng coupon
     */
    async handleWhenCompleteOrder(orderId: number, store: Store) {
        const order = await Order.findOneOrThrowId(orderId, {
            relations: ['promotionCampaigns', 'promotionCampaigns.couponCampaign', 'customer']
        }, '')

        const couponPromotions = order.promotionCampaigns.filter(p => p.discountType == PromotionDiscountType.Coupon)

        if (couponPromotions.length) {
            for (const promotionCampaign of couponPromotions) {
                await this.create({
                    customer: order.customer,
                    couponCampaign: promotionCampaign.couponCampaign,
                    giftedOrder: order
                })

                this.notificationService.handleWhenCustomerReceiveCouponFromPromotion(order.customer, order, promotionCampaign.couponCampaign, store)
            }
        }

    }

    /**
     * phát coupon cho khách có sinh nhật
     */
    async handleWhenDobCustomer() {
        const current = moment().format('MM-DD')

        const couponCampaign = await CouponCampaign.findOne({
            where: {
                type: CouponCampaignType.DOB
            }
        })

        let where = 'customer.dob LIKE :current AND customer.isDeleted = 0';

        const query = Customer.createQueryBuilder('customer')
            .where(where, {
                current: `${current}`
            })

        const total = await query.clone().getCount()
        const limit = 100
        const totalPage = Math.ceil(total / limit)

        for (let i = 1; i <= totalPage; i++) {
            const customers = await query
                .clone()
                .skip((i - 1) * limit)
                .take(limit)
                .getMany()

            const customerCoupons: CustomerCoupon[] = []
            for (const customer of customers) {
                const customerCoupon = new CustomerCoupon()
                customerCoupon.couponCampaign = couponCampaign
                customerCoupon.customer = customer;

                customerCoupon.expiredAt = moment().add(couponCampaign.expireDay, 'days').unix()
                customerCoupon.generateCode()
                customerCoupons.push(customerCoupon)
                customer.isAllowChangeDob = false
            }

            await CustomerCoupon.save(customerCoupons)
            await Customer.save(customers)
        }
    }


    async handleWhenCustomerRegister(customerId: number) {
        const customer = await Customer.findOneOrThrowId(customerId, null, '')
        const couponCampaign = await CouponCampaign.findOne({
            where: {
                type: CouponCampaignType.FirstRegister,
                isEnabled: true
            }
        })

        if (!couponCampaign) {
            return;
        }

        await this.create({
            customer,
            couponCampaign,
            expiredAt: moment().add(couponCampaign.expireDay, 'day').unix()
        })
    }

} //END FILE
