// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";


// IMPORT CUSTOM
import { CouponApplyFor, CouponCampaign, CouponCampaignType, CouponConditionType, CouponDiscountType } from "../entity/CouponCampaign";
import { Store } from "../entity/Store";
import { getCurrentTimeInt } from "../util/helper";
import { CouponCampaignDetailInsert } from "../entity-request/CouponCampaignDetailInsert";
import { CouponCampaignDetail } from "../entity/CouponCampaignDetail";
import moment from "moment";
import { CustomerCoupon } from "../entity/CustomerCoupon";
import { Customer } from "../entity/Customer";
import { SelectQueryBuilder } from "typeorm";


interface CouponCampaignQuery {
    page: number;
    limit: number
    search?: string
    storeId?: number
    dateType?: 'coming' | 'current' | 'end'
    type?: CouponCampaignType
}

interface CouponCampaignCreateParams {
    couponCampaign: CouponCampaign,
    details: CouponCampaignDetailInsert[],
    customerIds?: Number[],
    couponCampaignId?: number,
    store: Store
}

const couponCampaignDefaults: Partial<CouponCampaign>[] = [
    {
        type: CouponCampaignType.DOB,
        conditionType: CouponConditionType.AllProduct,
        discountType: CouponDiscountType.Fixed,
        conditionValue: 0,
        discountValue: 50000,
        discountMaxValue: 0,
        expireDay: 7
    },
    {
        type: CouponCampaignType.FirstRegister,
        conditionType: CouponConditionType.AllProduct,
        discountType: CouponDiscountType.Fixed,
        conditionValue: 0,
        discountValue: 10000,
        discountMaxValue: 0,
        expireDay: 7
    }
]

@Service()
export class CouponCampaignService {


    async init(store?: Store) {
        for (const item of couponCampaignDefaults) {
            let couponCampaign = await CouponCampaign.findOne({
                where: {
                    type: item.type,
                    store
                }
            })

            if (!couponCampaign) {
                couponCampaign = new CouponCampaign()
                couponCampaign.type = item.type
                couponCampaign.conditionType = item.conditionType
                couponCampaign.discountType = item.discountType
                couponCampaign.conditionValue = item.conditionValue
                couponCampaign.discountMaxValue = item.discountMaxValue
                couponCampaign.discountMaxValue = item.discountMaxValue
                couponCampaign.discountValue = item.discountValue
                couponCampaign.store = store;
                await couponCampaign.save()
            }
        }
    }

    async create() {

    }

    async createOrUpdate({ couponCampaign, details, customerIds, couponCampaignId, store }: CouponCampaignCreateParams): Promise<CouponCampaign> {

        let oldApplyFor = CouponApplyFor.All
        let oldCouponCampaign: CouponCampaign
        if (couponCampaignId) {
            oldCouponCampaign = await CouponCampaign.createQueryBuilder('couponCampaign')
                .leftJoinAndSelect('couponCampaign.customerCoupons', 'customerCoupons')
                .leftJoinAndSelect('couponCampaign.store', 'store')
                .leftJoinAndSelect('customerCoupons.customer', 'customer')
                .where('couponCampaign.id = :couponCampaignId AND couponCampaign.isDeleted = false AND store.id =:storeId', { couponCampaignId, storeId: store.id })
                .getOne()

            if (!oldCouponCampaign) {
                throw new BadRequest("Coupon Campaign không tồn tại.")
            }

            const current = getCurrentTimeInt()
            if (oldCouponCampaign.endAt < current && oldCouponCampaign.type == CouponCampaignType.Event) {
                throw new BadRequest("Không thể sửa chiến khi đang diễn ra hoặc đã kết thúc");
            }
            couponCampaign.id = +couponCampaignId;
            oldApplyFor = oldCouponCampaign.applyFor

        }

        await this.validate(couponCampaign, couponCampaignId)

        if (couponCampaign.conditionType == CouponConditionType.AllProduct) {
            couponCampaign.couponCampaignDetails = []
        } else {
            const couponCampaignDetails = await Promise.all(details.map(e => e.toCouponCampaignDetail()))
            await CouponCampaignDetail.save(couponCampaignDetails)
            couponCampaign.couponCampaignDetails = couponCampaignDetails;
        }

        couponCampaign.store = store;
        if (couponCampaign.startAt && couponCampaign.endAt) {
            couponCampaign.expireDay = Math.floor(moment.duration(couponCampaign.endAt - couponCampaign.startAt, 'seconds').asDays())
        }

        if (couponCampaign.type === CouponCampaignType.Event) {
            couponCampaign.applyFor = CouponApplyFor.All
        }

        await couponCampaign.save()

        //type "EVENT" và action create 
        if (couponCampaign.type === CouponCampaignType.Event && !couponCampaignId) {
            let customersData = await Customer.createQueryBuilder('customer')
                .select('customer.id', 'id')
                .leftJoinAndSelect('customer.store', 'store')
                .where('store.id = :storeId', { storeId: store.id })
                .getRawMany()

            let customerIdsData = customersData.map((item) => item.id)

            const customerCoupons = await Promise.all(customerIdsData.map(async (item) => {
                const customerCoupon = new CustomerCoupon()
                await customerCoupon.assignCustomer(item)
                await customerCoupon.generateCode()
                customerCoupon.expiredAt = couponCampaign.endAt
                customerCoupon.couponCampaign = couponCampaign
                return customerCoupon
            }))

            await CustomerCoupon.save(customerCoupons)

        }
        //nếu là type "GIFT" và actions là create hoặc update
        else if (couponCampaign.type !== CouponCampaignType.Event) {
            let customersData = await Customer.createQueryBuilder('customer')
                .select('customer.id', 'id')
                .leftJoin('customer.store', 'store')
                .where('store.id = :storeId', { storeId: store.id })
                .getRawMany()

            let customerIdsData = customersData.map((item) => item.id)

            if (couponCampaign.applyFor === CouponApplyFor.Some) {
                if (couponCampaignId) {
                    const customerIdsExisted = oldCouponCampaign.customerCoupons.map((item) => {
                        return item.customer.id
                    })

                    if (customerIdsExisted.length) {
                        await CustomerCoupon.createQueryBuilder('customerCoupon')
                            .leftJoinAndSelect('customerCoupon.couponCampaign', 'couponCampaign')
                            .leftJoin('customerCoupon.customer', 'customer')
                            .update()
                            .set({
                                isDeleted: true
                            })
                            .where(`customer.id IN (:...customerIdsExisted)`, { customerIdsExisted })
                            .andWhere('couponCampaign.id = :couponCampaignId', { couponCampaignId })
                            .execute()
                    }

                    customerIdsData = customerIds
                } else {
                    const existsCustomerIdsData = customerIds.filter((item) => customerIdsData.includes(item))
                    customerIdsData = existsCustomerIdsData
                }
            } else if (couponCampaign.applyFor === CouponApplyFor.All && oldApplyFor === CouponApplyFor.Some) {
                const customerIdsExisted = oldCouponCampaign.customerCoupons.map((item) => {
                    return item.customer.id
                })

                if (customerIdsExisted.length) {
                    await CustomerCoupon.createQueryBuilder('customerCoupon')
                        .leftJoinAndSelect('customerCoupon.couponCampaign', 'couponCampaign')
                        .leftJoin('customerCoupon.customer', 'customer')
                        .update()
                        .set({
                            isDeleted: true
                        })
                        .where(`customer.id IN (:...customerIdsExisted)`, { customerIdsExisted })
                        .andWhere('couponCampaign.id = :couponCampaignId', { couponCampaignId })
                        .execute()
                }
            }

            const customerCoupons = await Promise.all(customerIdsData.map(async (item) => {
                const customerCoupon = new CustomerCoupon()
                await customerCoupon.assignCustomer(item)
                await customerCoupon.generateCode()
                customerCoupon.expiredAt = couponCampaign.endAt
                customerCoupon.couponCampaign = couponCampaign
                return customerCoupon
            }))

            await CustomerCoupon.save(customerCoupons)
        }

        delete couponCampaign.customerCoupons
        return couponCampaign

    }

    async getManyAndCount({
        page,
        limit,
        search = '',
        storeId,
        dateType,
        type
    }: CouponCampaignQuery) {
        let where = `couponCampaign.name LIKE :search AND couponCampaign.isDeleted = false AND customerCoupon.isDeleted = false`;
        let whereDateType = '1'


        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        if (type) {
            where += ' AND couponCampaign.type = :type'
        }


        const currentAt = getCurrentTimeInt()
        switch (dateType) {
            case 'coming':
                whereDateType += ` AND couponCampaign.startAt > ${currentAt}`
                break;

            case 'current':
                whereDateType += ` AND ${currentAt} BETWEEN couponCampaign.startAt AND couponCampaign.endAt`;
                break;

            case 'end':
                whereDateType += ` AND couponCampaign.endAt < ${currentAt}`
                break;

            default:
                break;
        }

        where += ` AND ${whereDateType}`

        const [couponCampaigns, total] = await CouponCampaign.createQueryBuilder('couponCampaign')
            .leftJoinAndSelect('couponCampaign.store', 'store')
            .leftJoinAndSelect('couponCampaign.customerCoupons', 'customerCoupon')
            .leftJoinAndSelect('customerCoupon.customer', 'customer')
            .leftJoinAndSelect('couponCampaign.couponCampaignDetails', 'couponCampaignDetail')
            .leftJoinAndSelect('couponCampaignDetail.product', 'product')
            .where(where, { search: `%${search}%`, storeId, type })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('couponCampaign.id', 'DESC')
            .getManyAndCount()

        return { couponCampaigns, total }

    }

    async validate(couponCampaign: CouponCampaign, id: number) {
        const { type } = couponCampaign;

        if (couponCampaign.startAt > couponCampaign.endAt) {
            throw new BadRequest("Ngày bắt đầu và kết thúc không hợp lệ!");
        }

        const otherCouponCampaign = await CouponCampaign.findOne({
            where: {
                type
            }
        })

        const notAllowedTypes = [CouponCampaignType.DOB, CouponCampaignType.FirstRegister]
        if (otherCouponCampaign && notAllowedTypes.includes(type) && id != otherCouponCampaign.id) {
            throw new BadRequest("Không thể tạo chiến dịch này nữa!");
        }

        //giảm giá tiền cứng, yêu cầu tiền giảm nhỏ hơn hoặc bằng giá trị đơn
        if (couponCampaign.discountType == CouponDiscountType.Fixed && couponCampaign.discountValue > couponCampaign.conditionValue) {
            throw new BadRequest("Giá trị đơn hàng tối thiểu không hợp lệ.");
        }
    }

} //END FILE
