// IMPORT LIBRARY
import { Service } from "@tsed/common";
import moment from "moment";
import { escape } from "mysql2";
import { CouponCampaign, CouponCampaignType, CouponDiscountType } from "../entity/CouponCampaign";
import { Customer } from "../entity/Customer";
import { Order } from "../entity/Order";
import { OrderStatus } from "../types/order";
import { BenefitPackageOrder } from "../entity/BenefitPackageOrder";
import { BenefitPackage } from "../entity/BenefitPackage";


// IMPORT CUSTOM

interface DashboardQuery {
    fromAt: number;
    toAt: number;
    storeId?: number
    timezone?: string
}

interface TopSaleQuery extends DashboardQuery {
    limit?: number
}

@Service()
export class DashboardService {

    async topProducts({
        fromAt = moment().startOf('month').unix(),
        toAt = moment().endOf('month').unix(),
        storeId
    }: DashboardQuery) {
        const statuses = [OrderStatus.Cancel, OrderStatus.ReturnRefund]
        let where = `order.isDeleted = 0 AND order.status NOT IN (:...statuses)`;

        where += ` AND order.createdAt BETWEEN ${fromAt} AND ${toAt}`

        where += ` AND orderDetail.isGift = 0`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const products = await Order.createQueryBuilder('order')
            .select('SUM(orderDetail.quantity)', 'totalQuantity')
            .addSelect('product.id', 'productId')
            .addSelect('product.name', 'productName')
            .innerJoin('order.details', 'orderDetail')
            .innerJoin('orderDetail.product', 'product')
            .leftJoin('order.store', 'store')
            .where(where, { storeId, statuses })
            .limit(10)
            .groupBy('product.id')
            .orderBy('totalQuantity', 'DESC')
            .getRawMany();

        return products
    }

    /**
     * Doanh thu theo ngày
     */
    async summarySaleOrderByDate({
        fromAt = moment().startOf('month').unix(),
        toAt = moment().endOf('month').unix(),
        storeId,
        timezone = '+7:00'
    }: DashboardQuery) {
        const statuses = [OrderStatus.Cancel, OrderStatus.ReturnRefund]
        let where = `order.isDeleted = 0 AND order.status NOT IN (:...statuses)`;

        where += ` AND order.createdAt BETWEEN ${fromAt} AND ${toAt}`

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const orders = await Order.createQueryBuilder('order')
            .select('SUM(order.moneyFinal)', 'totalMoney')
            .addSelect('COUNT(*)', 'totalOrders')
            .addSelect(`DATE_FORMAT(CONVERT_TZ(FROM_UNIXTIME(order.createdAt), @@session.time_zone,'${timezone}'),'%Y-%m-%d')`, 'date')
            .leftJoin('order.store', 'store')
            .where(where, { storeId, statuses })
            .groupBy('date')
            .orderBy('date', 'ASC')
            .getRawMany();

        return orders
    }

    /**
     * Doanh thu của các gói
     */
    async summaryBenefitPackageTotal() {

        const allBenefitPackages = await BenefitPackage.find();
        const benefitPackage = await BenefitPackage.createQueryBuilder('benefitPackage')
            .leftJoin('benefitPackage.benefitPackageOrders', 'benefitPackageOrders')
            .leftJoin('benefitPackageOrders.benefitPackage', 'check')
            .select('SUM(check.price)', 'totalMoney')
            .addSelect('COUNT(benefitPackageOrders.id)', 'totalBenefitPackage')
            .addSelect('benefitPackage.name', 'name')
            .groupBy('benefitPackage.name')
            .getRawMany();

        const result = allBenefitPackages.map(b => {
            const detail = benefitPackage.find(d => d.name === b.name);
            return {
                name: b.name,
                totalMoney: detail ? detail.totalMoney ? detail.totalMoney : 0 : 0,
                totalBenefitPackage: detail ? detail.totalBenefitPackage ? detail.totalBenefitPackage : 0 : 0,
            };
        });


        result.push({
            name: 'Total',
            totalMoney: benefitPackage.reduce((acc, b) => acc + (b.totalMoney || 0), 0),
            totalBenefitPackage: benefitPackage.reduce((acc, b) => acc + (b.totalBenefitPackage || 0), 0),
        });

        return result;
    }

    /**
     * SL sp đã bán theo ngày
     */
    async summaryQuantityByDate({
        fromAt = moment().startOf('month').unix(),
        toAt = moment().endOf('month').unix(),
        storeId,
        timezone = '+7:00'
    }: DashboardQuery) {
        const statuses = [OrderStatus.Cancel, OrderStatus.ReturnRefund];

        let where = `order.isDeleted = 0 AND order.status NOT IN (:...statuses)`;

        where += ` AND order.createdAt BETWEEN ${fromAt} AND ${toAt}`

        where += ` AND orderDetail.isGift = 0`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const orders = await Order.createQueryBuilder('order')
            .select('SUM(orderDetail.quantity)', 'totalQuantity')
            .addSelect(`DATE_FORMAT(CONVERT_TZ(FROM_UNIXTIME(order.createdAt), @@session.time_zone,'${timezone}'),'%Y-%m-%d')`, 'date')
            .innerJoin('order.details', 'orderDetail')
            .leftJoin('order.store', 'store')
            .where(where, { storeId, statuses })
            .groupBy('date')
            .orderBy('date', 'ASC')
            .getRawMany();

        return orders
    }


    /**
     * Thống kê sl khách theo từng loại: khách mới, khách thương xuyên mua, khách lâu chưa mua
     */
    async summaryCustomer() {
        const data = await Customer.createQueryBuilder('customer')
            .select(`SUM( IF(customer.lastOrderAt = 0 OR customer.cycleBuy = 0, 1, 0) )`, 'newCustomer')
            .addSelect(`SUM( IF( customer.lastOrderAt != 0 AND (UNIX_TIMESTAMP() - customer.lastOrderAt) / 3600 <= customer.cycleBuy, 1, 0) )`, 'regularCustomer')
            .addSelect(`SUM( IF( customer.lastOrderAt != 0 AND (UNIX_TIMESTAMP() - customer.lastOrderAt) / 3600 > customer.cycleBuy, 1, 0) )`, 'riskCustomer')
            .getRawOne();

        return data;
    }


    /**
     *  thống kê coupon giảm giá
     */
    async summaryCouponDiscount({
        fromAt = moment().subtract(7, 'days').startOf('day').unix(),
        toAt = moment().endOf('day').unix(),
        storeId
    }: DashboardQuery) {
        const statuses = [OrderStatus.Cancel, OrderStatus.ReturnRefund];

        let where = `couponCampaign.isDeleted = 0 AND couponCampaign.discountType IN (:...types) AND couponCampaign.type = ${escape(CouponCampaignType.Event)}`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const query = CouponCampaign.createQueryBuilder('couponCampaign')
            .leftJoin('couponCampaign.orders', 'order', `order.isDeleted = false AND order.status NOT IN (:...statuses)`)
            .leftJoin('couponCampaign.store', 'store')
            .where(where, {
                statuses,
                storeId,
                types: [CouponDiscountType.Fixed, CouponDiscountType.Percent]
            })
            .andWhere(` IF(order.id is not null, order.createdAt BETWEEN ${fromAt} AND ${toAt}, true)`)

        const coupons: {
            id: number,
            name: string,
            totalDiscount: number,
            totalOrders: number,
            storeId: number,
            storeName: number
        }[] = await query
            .clone()
            .select('couponCampaign.id', 'id')
            .addSelect('couponCampaign.name', 'name')
            .addSelect('couponCampaign.startAt', 'startAt')
            .addSelect('couponCampaign.endAt', 'endAt')
            .addSelect('COALESCE(SUM(order.moneyDiscountCoupon), 0)', 'totalDiscount')
            .addSelect('COALESCE(SUM(order.moneyProduct), 0)', 'totalMoneyProduct')
            .addSelect('COALESCE(COUNT(order.id), 0)', 'totalOrders')
            .addSelect('store.id', 'storeId')
            .addSelect('store.name', 'storeName')
            .groupBy('couponCampaign.id')
            .orderBy('couponCampaign.id', 'DESC')
            .getRawMany();

        const total = await query.select('COUNT(*)', 'total').getRawOne()
        return { coupons, total: total.total || 0 };
    }

} //END FILE
