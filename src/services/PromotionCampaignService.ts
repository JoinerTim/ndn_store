// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";
import { escape } from "mysql2";
import { FlashSaleCampaignDetail } from "../entity/FlashSaleCampaignDetail";
import { Order } from "../entity/Order";
import { OrderDetail } from "../entity/OrderDetail";


// IMPORT CUSTOM
import { PromotionCampaign, PromotionConditionType, PromotionDiscountType } from "../entity/PromotionCampaign";
import { PromotionCampaignDetail } from "../entity/PromotionCampaignDetail";
import { Store } from "../entity/Store";
import { OrderStatus } from "../types/order";
import { getCurrentTimeInt } from "../util/helper";

interface PromotionCampaignQuery {
    page: number;
    limit: number
    search?: string,
    dateType?: 'coming' | 'current' | 'end', //current: đang diễn ra
    storeId?: number;
    discountTypes?: PromotionDiscountType[];
    productIds?: number[]
    conditionType?: PromotionConditionType
    discountType?: PromotionDiscountType
    promotionIds?: number[],
    fromAt?: number
    toAt?: number
}

@Service()
export class PromotionCampaignService {

    async getManyAndCount({
        page,
        limit,
        search = '',
        dateType,
        storeId,
        discountTypes,
        productIds,
        conditionType,
        discountType
    }: PromotionCampaignQuery) {
        let where = `CONCAT(promotionCampaign.name, ' ', promotionCampaign.code) LIKE :search AND promotionCampaign.isDeleted = false`;
        let whereDateType = '1'

        const currentAt = getCurrentTimeInt();

        switch (dateType) {
            case 'coming':
                whereDateType += ` AND promotionCampaign.startAt > ${currentAt}`
                break;

            case 'current':
                whereDateType += ` AND promotionCampaign.startAt <= ${currentAt} AND promotionCampaign.endAt >= ${currentAt}`
                break;

            case 'end':
                whereDateType += ` AND promotionCampaign.endAt < ${currentAt}`
                break;

            default:
                break;
        }

        where += ` AND ${whereDateType}`

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        if (discountTypes?.length) {
            where += ' AND promotionCampaign.discountType IN (:...discountTypes)'
        }

        if (conditionType) {
            where += ' AND promotionCampaign.conditionType = :conditionType'
        }

        if (discountType) {
            where += ' AND promotionCampaign.discountType = :discountType'
        }

        const query = PromotionCampaign.createQueryBuilder('promotionCampaign')
            .leftJoinAndSelect('promotionCampaign.promotionCampaignDetails', 'promotionCampaignDetail')
            .leftJoinAndSelect('promotionCampaignDetail.product', 'product')
            .leftJoinAndSelect('promotionCampaign.couponCampaign', 'couponCampaign')
            .leftJoinAndSelect('promotionCampaign.store', 'store')

        if (productIds?.length) {
            const subQuery = PromotionCampaign.createQueryBuilder('promotionCampaign')
                .select('promotionCampaign.id', 'id')
                .innerJoin('promotionCampaign.promotionCampaignDetails', 'promotionCampaignDetail')
                .innerJoin('promotionCampaignDetail.product', 'product')
                .where(`((product.id IN (${productIds.join(', ')}) AND promotionCampaignDetail.isGift = 0) OR promotionCampaign.conditionType = ${escape(PromotionConditionType.AllProduct)})`)
                .andWhere(whereDateType)
                .setParameter('productIds', productIds)

            where += ` AND promotionCampaign.id IN (${subQuery.getQuery()})`;
        }

        const [promotionCampaigns, total] = await query
            .where(where, { search: `%${search}%`, storeId, discountTypes, conditionType, discountType })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('promotionCampaign.id', 'DESC')
            .getManyAndCount()

        return { promotionCampaigns, total }
    }


    async getOne(promotionCampaignId: number, storeId?: number) {
        let where = `promotionCampaign.id = :promotionCampaignId AND promotionCampaign.isDeleted = false`
        if (storeId) {
            where += ` AND store.id = :storeId`
        }
        const promotionCampaign = await PromotionCampaign.createQueryBuilder('promotionCampaign')
            .leftJoinAndSelect('promotionCampaign.promotionCampaignDetails', 'promotionCampaignDetails')
            .leftJoinAndSelect('promotionCampaign.store', 'store')
            .leftJoinAndSelect('promotionCampaign.couponCampaign', 'couponCampaign')
            .leftJoinAndSelect('promotionCampaignDetails.product', 'product')
            .where(where, { promotionCampaignId, storeId })
            .getOne()

        const products = promotionCampaign ? promotionCampaign.promotionCampaignDetails.map((item) => {
            return item.product
        }) : []
        if (storeId) {
            return promotionCampaign
        }
        return products
    }

    /**
     * Giảm giá cho đơn
     */
    async summaryDiscountFixed({
        limit = 10,
        page = 1,
        storeId,
        promotionIds,
        fromAt,
        toAt
    }: PromotionCampaignQuery) {
        const statuses = [OrderStatus.Cancel, OrderStatus.ReturnRefund];

        let where = `promotionCampaign.isDeleted = 0 AND promotionCampaign.discountType = ${escape(PromotionDiscountType.Fixed)} AND order.isDeleted = 0 AND order.status NOT IN (:...statuses)`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        if (promotionIds?.length) {
            where += ' AND promotionCampaign.id IN (:...promotionIds)'
        }

        if (fromAt && toAt) {
            where += ` AND order.createdAt BETWEEN ${fromAt} AND ${toAt}`
        }

        const query = PromotionCampaign.createQueryBuilder('promotionCampaign')
            .innerJoin('promotionCampaign.orders', 'order')
            .leftJoin('promotionCampaign.store', 'store')
            .where(where, { promotionIds, storeId, statuses })

        const promotions = await query
            .clone()
            .select('SUM(order.moneyDiscount)', 'totalDiscount')
            .addSelect('SUM(order.moneyProduct)', 'totalMoneyProduct')
            .addSelect('COUNT(*)', 'totalOrders')
            .addSelect('promotionCampaign.id', 'promotionCampaignId')
            .addSelect('promotionCampaign.code', 'promotionCampaignCode')
            .addSelect('promotionCampaign.name', 'promotionCampaignName')
            .addSelect('promotionCampaign.startAt', 'promotionCampaignStartAt')
            .addSelect('promotionCampaign.endAt', 'promotionCampaignEndAt')
            .offset((page - 1) * limit)
            .limit(limit)
            .groupBy('promotionCampaign.id')
            .orderBy('promotionCampaign.id', 'DESC')
            .getRawMany();

        const totalQuery = await query.clone()
            .select('COUNT(*)', 'total')

        const resultTotal = await totalQuery.getRawOne()

        return {
            promotions,
            total: resultTotal?.total || 0
        }
    }

    /**
     * k.mãi tặng kèm
     */
    async summaryGiftPromotion({
        limit = 10,
        page = 1,
        storeId,
        promotionIds,
        fromAt,
        toAt
    }: PromotionCampaignQuery) {
        let wherePromotion = `promotionCampaign.isDeleted = 0 AND promotionCampaign.discountType = ${escape(PromotionDiscountType.Gift)}`

        let where = `order.isDeleted = 0 AND order.status != ${escape(OrderStatus.Cancel)} AND order.status != ${escape(OrderStatus.Pending)}`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        if (promotionIds?.length) {
            wherePromotion += ` AND promotionCampaign.id IN (${promotionIds.join(', ')})`
        }

        if (fromAt && toAt) {
            where += ` AND order.createdAt BETWEEN ${fromAt} AND ${toAt}`
            wherePromotion += ` AND (${fromAt} BETWEEN promotionCampaign.startAt AND promotionCampaign.endAt OR ${toAt} BETWEEN promotionCampaign.startAt AND promotionCampaign.endAt)`
        }

        const promotionQuery = PromotionCampaign.createQueryBuilder('promotionCampaign')
            .select('promotionCampaign.id', 'id')
            .where(wherePromotion)

        console.log('gift promotion query:', promotionQuery.getQuery());
        where += ` AND promotionCampaign.id IN (${promotionQuery.getQuery()})`

        const query = Order.createQueryBuilder('order')
            .leftJoin('order.details', 'orderDetail')
            .leftJoin('order.gifts', 'gift')
            .leftJoin('gift.giftPromotionCampaignDetail', 'giftPromotionCampaignDetail')
            .leftJoin('giftPromotionCampaignDetail.promotionCampaign', 'promotionCampaign')
            .leftJoin('promotionCampaign.store', 'store')
            .where(where, { promotionIds, storeId })

        console.log('gift promotion order query:', query.getQuery());


        const promotions = await query
            .clone()
            .select('SUM(giftPromotionCampaignDetail.finalPrice * gift.quantity)', 'totalDiscount')
            .addSelect('COUNT(*)', 'totalOrders')
            .addSelect('SUM(orderDetail.quantity * orderDetail.finalPrice)', 'totalMoneyFinal')
            .addSelect('promotionCampaign.id', 'promotifonCampaignId')
            .addSelect('promotionCampaign.code', 'promotionCampaignCode')
            .addSelect('promotionCampaign.name', 'promotionCampaignName')
            .offset((page - 1) * limit)
            .limit(limit)
            .groupBy('promotionCampaign.id')
            .getRawMany();

        const totalQuery = await query.clone()
            .select('COUNT(DISTINCT promotionCampaign.id)', 'total')

        const resultTotal = await totalQuery.getRawOne()

        return {
            promotions,
            total: resultTotal?.total || 0
        }
    }

    async summaryDiscountShipFee({
        limit = 10,
        page = 1,
        storeId,
        promotionIds,
        fromAt,
        toAt
    }: PromotionCampaignQuery) {
        const statuses = [OrderStatus.Cancel, OrderStatus.ReturnRefund];

        let where = `promotionCampaign.isDeleted = 0 AND promotionCampaign.discountType = ${escape(PromotionDiscountType.ShipFee)} AND order.isDeleted = 0 AND order.status NOT IN (:...statuses)`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        if (promotionIds?.length) {
            where += ' AND promotionCampaign.id IN (:...promotionIds)'
        }

        if (fromAt && toAt) {
            where += ` AND order.createdAt BETWEEN ${fromAt} AND ${toAt}`
        }

        const query = PromotionCampaign.createQueryBuilder('promotionCampaign')
            .innerJoin('promotionCampaign.orders', 'order')
            .leftJoin('promotionCampaign.store', 'store')
            .where(where, { promotionIds, statuses });

        const promotions = await query
            .clone()
            .select('SUM(order.moneyDiscountShipFee)', 'totalDiscount')
            .addSelect('SUM(order.moneyProduct)', 'totalMoneyProduct')
            .addSelect('COUNT(*)', 'totalOrders')
            .addSelect('promotionCampaign.id', 'promotionCampaignId')
            .addSelect('promotionCampaign.code', 'promotionCampaignCode')
            .addSelect('promotionCampaign.name', 'promotionCampaignName')
            .offset((page - 1) * limit)
            .limit(limit)
            .groupBy('promotionCampaign.id')
            .getRawMany();

        const totalQuery = await query.clone()
            .select('COUNT(*)', 'total')

        const resultTotal = await totalQuery.getRawOne()

        return {
            promotions,
            total: resultTotal?.total || 0
        }
    }

    /**
     * Giảm giá theo % sp
     */
    async summaryDiscountPercent({
        limit = 10,
        page = 1,
        storeId,
        promotionIds,
        fromAt,
        toAt
    }: PromotionCampaignQuery) {
        const statuses = [OrderStatus.Cancel, OrderStatus.ReturnRefund];

        let where = `promotionCampaign.isDeleted = 0 AND promotionCampaign.discountType = ${escape(PromotionDiscountType.Percent)} AND order.isDeleted = 0 AND order.status NOT IN (:...statuses)`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        if (promotionIds?.length) {
            where += ' AND promotionCampaign.id IN (:...promotionIds)'
        }

        if (fromAt && toAt) {
            where += ` AND order.createdAt BETWEEN ${fromAt} AND ${toAt}`
        }

        const query = PromotionCampaign.createQueryBuilder('promotionCampaign')
            .innerJoin('promotionCampaign.promotionCampaignDetails', 'promotionCampaignDetail')
            .innerJoin('promotionCampaignDetail.orderDetails', 'orderDetail')
            .innerJoin('orderDetail.order', 'order')
            .leftJoin('promotionCampaign.store', 'store')
            .where(where, { promotionIds, storeId, statuses });

        const promotions = await query
            .clone()
            .select('SUM(orderDetail.discount * orderDetail.quantity)', 'totalDiscount')
            .addSelect('SUM(orderDetail.price * orderDetail.quantity)', 'totalMoneyProduct')
            .addSelect('COUNT(DISTINCT order.id)', 'totalOrders')
            .addSelect('promotionCampaign.id', 'promotionCampaignId')
            .addSelect('promotionCampaign.code', 'promotionCampaignCode')
            .addSelect('promotionCampaign.name', 'promotionCampaignName')
            .addSelect('promotionCampaign.startAt', 'promotionCampaignStartAt')
            .addSelect('promotionCampaign.endAt', 'promotionCampaignEndAt')
            .offset((page - 1) * limit)
            .limit(limit)
            .groupBy('promotionCampaign.id')
            .orderBy('promotionCampaign.id', 'DESC')
            .getRawMany();

        const totalQuery = await query.clone()
            .select('COUNT(*)', 'total')

        const resultTotal = await totalQuery.getRawOne()

        return {
            promotions,
            total: resultTotal?.total || 0
        }
    }


    /**
     * check tính hợp lệ của sp trong chiến dịch
     */
    async validate(promotionCampaign: PromotionCampaign, promotionCampaignDetails: PromotionCampaignDetail[], store: Store) {
        const {
            startAt,
            endAt,
            conditionType,
            discountType,
            code
        } = promotionCampaign;

        if (!code) {
            throw new BadRequest("Mã khuyến mãi không được rỗng!");
        }

        if (promotionCampaign.startAt > promotionCampaign.endAt) {
            throw new BadRequest("Ngày bắt đầu và kết thúc không hợp lệ!");
        }

        //validate duplicate code
        let whereDuplicate = 'promotionCampaign.isDeleted = 0 AND promotionCampaign.code = :code';
        if (promotionCampaign.id) {
            whereDuplicate += ` AND promotionCampaign.id != ${promotionCampaign.id}`
        }

        if (store) {
            whereDuplicate += ' AND store.id = :storeId'
        }

        const otherPromotionCampaign = await PromotionCampaign.createQueryBuilder('promotionCampaign')
            .leftJoin('promotionCampaign.store', 'store')
            .where(whereDuplicate, { code, storeId: store?.id })
            .getOne();

        if (otherPromotionCampaign) {
            throw new BadRequest("Mã khuyến mãi đã tồn tại");
        }

        if (conditionType == PromotionConditionType.SomeProduct && discountType == PromotionDiscountType.Percent) {
            //validate với chiến dịch khác (giảm theo % trên từng sp)
            let where = `promotionCampaign.isDeleted = 0 AND (${startAt} BETWEEN promotionCampaign.startAt AND promotionCampaign.endAt OR ${endAt} BETWEEN promotionCampaign.startAt AND promotionCampaign.endAt OR (${startAt} <= promotionCampaign.startAt AND ${endAt} >= promotionCampaign.endAt))`;

            where += ` AND promotionCampaign.conditionType = :conditionType AND promotionCampaign.discountType = :discountType AND promotionCampaignDetail.isGift = 0`;

            if (store) {
                where += ` AND store.id = ${store.id}`;
            }

            if (promotionCampaign.id) {
                where += ` AND promotionCampaign.id != ${promotionCampaign.id}`;
            }

            const queryOtherPromotion = PromotionCampaignDetail.createQueryBuilder('promotionCampaignDetail')
                .innerJoinAndSelect('promotionCampaignDetail.product', 'product')
                .innerJoinAndSelect('promotionCampaignDetail.promotionCampaign', 'promotionCampaign')
                .leftJoin('promotionCampaign.store', 'store')
                .where(where, {
                    conditionType: PromotionConditionType.SomeProduct,
                    discountType: PromotionDiscountType.Percent
                })
                .andWhere('product.id IN (:...productIds)', {
                    productIds: promotionCampaignDetails.map(d => d.product.id)
                })

            // console.log('promotion validate queryOtherPromotion:', queryOtherPromotion.getQuery());


            const otherPromotionCampaignDetails = await queryOtherPromotion
                .getMany()

            for (const detail of otherPromotionCampaignDetails) {
                throw new BadRequest(`Sản phẩm '${detail.product.name}': loại giảm giá theo % chỉ được giảm trong cùng một thời điểm, đã tồn tại trong chiến dịch '${detail.promotionCampaign.name} - #${detail.promotionCampaign.code}'`);
            }
            //

            //validate với flash sale (giảm theo % trên từng sp)
            let whereFlashSale = `flashSaleCampaign.isDeleted = 0 AND (${startAt} BETWEEN flashSaleCampaign.startAt AND flashSaleCampaign.endAt OR ${endAt} BETWEEN flashSaleCampaign.startAt AND flashSaleCampaign.endAt OR (${startAt} <= flashSaleCampaign.startAt AND ${endAt} >= flashSaleCampaign.endAt)) AND product.id IN (:...productIds)`;

            if (store) {
                whereFlashSale += ` AND store.id = ${store.id}`;
            }

            const otherFlashSales = await FlashSaleCampaignDetail.createQueryBuilder('flashSaleCampaignDetail')
                .leftJoinAndSelect('flashSaleCampaignDetail.flashSaleCampaign', 'flashSaleCampaign')
                .innerJoinAndSelect('flashSaleCampaignDetail.product', 'product')
                .leftJoin('flashSaleCampaign.store', 'store')
                .where(whereFlashSale, {
                    productIds: promotionCampaignDetails.map(d => d.product.id)
                })
                .getMany()

            for (const detail of otherFlashSales) {
                throw new BadRequest(`Sản phẩm '${detail.product.name}' đã tồn tại trong chiến dịch FlashSale '${detail.flashSaleCampaign.name}'`);
            }
            //
        }
    }

} //END FILE
