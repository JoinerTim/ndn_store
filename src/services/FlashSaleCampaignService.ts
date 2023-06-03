// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";


// IMPORT CUSTOM
import { FlashSaleCampaign } from "../entity/FlashSaleCampaign";
import { FlashSaleCampaignDetail } from "../entity/FlashSaleCampaignDetail";
import { Order } from "../entity/Order";
import { PromotionConditionType, PromotionDiscountType } from "../entity/PromotionCampaign";
import { PromotionCampaignDetail } from "../entity/PromotionCampaignDetail";
import { Store } from "../entity/Store";
import { getCurrentTimeInt } from "../util/helper";

interface FlashSaleCampaignQuery {
    page: number;
    limit: number
    search?: string
    dateType?: 'coming' | 'current' | 'end', //current: đang diễn ra
    customerId?: number
    storeId?: number
    fromAt?: number
    toAt?: number
}

@Service()
export class FlashSaleCampaignService {

    async getManyAndCount({
        page,
        limit,
        search = '',
        dateType,
        customerId,
        storeId
    }: FlashSaleCampaignQuery) {
        let where = `flashSaleCampaign.name LIKE :search AND flashSaleCampaign.isDeleted = false`;

        const currentAt = getCurrentTimeInt()

        switch (dateType) {
            case 'coming':
                where += ` AND flashSaleCampaign.startAt > ${currentAt}`
                break;

            case 'current':
                where += ` AND ${currentAt} BETWEEN flashSaleCampaign.startAt AND flashSaleCampaign.endAt`
                break;

            case 'end':
                where += ` AND flashSaleCampaign.endAt < ${currentAt}`
                break;

            default:
                break;
        }

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const query = FlashSaleCampaign.createQueryBuilder('flashSaleCampaign')
            .leftJoinAndSelect('flashSaleCampaign.store', 'store')
            .leftJoinAndSelect('flashSaleCampaign.flashSaleCampaignDetails', 'flashSaleCampaignDetail')
            .leftJoinAndSelect('flashSaleCampaignDetail.product', 'product', 'product.isDeleted = 0')
            .leftJoinAndSelect('product.flashSaleCampaignDetails', 'flashSaleCampaignDetail2')
            .leftJoinAndSelect('product.productCustomFields', 'productCustomField')
            .leftJoinAndSelect('productCustomField.customField', 'customField')
            .leftJoinAndSelect('product.productCategory', 'productCategory')
            .where(where, { search: `%${search}%`, storeId });

        if (customerId) {
            query.leftJoinAndSelect('product.likedProducts', 'likedProduct', 'likedProduct.customerId = :customerId', { customerId })
            query.leftJoinAndSelect('product.viewedProducts', 'viewedProduct', 'viewedProduct.customerId = :customerId', { customerId })
        }

        // console.log('query flash sale:', query.getQuery());

        const [flashSaleCampaigns, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('flashSaleCampaign.id', 'DESC')
            .getManyAndCount();

        for (const flashSaleCampaign of flashSaleCampaigns) {
            for (const flashSaleCampaignDetail of flashSaleCampaign.flashSaleCampaignDetails) {
                if (flashSaleCampaignDetail.product) {
                    flashSaleCampaignDetail.product.isLiked = !!flashSaleCampaignDetail.product.likedProducts?.length
                    flashSaleCampaignDetail.product.isViewed = !!flashSaleCampaignDetail.product.viewedProducts?.length
                }
            }

        }

        return { flashSaleCampaigns, total }
    }

    /**
     * Giảm giá theo % sp
     */
    async summaryDiscount({
        limit = 10,
        page = 1,
        storeId,
        fromAt,
        toAt
    }: FlashSaleCampaignQuery) {
        let where = `flashSaleCampaign.isDeleted = 0 AND flashSaleCampaign.isDeleted = 0`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const query = FlashSaleCampaign.createQueryBuilder('flashSaleCampaign')
            .innerJoin('flashSaleCampaign.flashSaleCampaignDetails', 'flashSaleCampaignDetail')
            .leftJoinAndSelect('flashSaleCampaignDetail.orderDetails', 'orderDetail')
            .leftJoinAndSelect('orderDetail.order', 'order')
            .leftJoin('flashSaleCampaign.store', 'store')
            .where(where, { storeId })
            .andWhere(` IF(order.id is not null, order.createdAt BETWEEN ${fromAt} AND ${toAt}, true)`)

        const flashSaleCampaigns = await query
            .clone()
            .select('COALESCE(SUM(orderDetail.discountFlashSale * orderDetail.quantity), 0)', 'totalDiscount')
            .addSelect('COALESCE(COUNT(DISTINCT (order.id)), 0)', 'totalOrders')
            .addSelect('COALESCE(SUM(orderDetail.finalPrice * orderDetail.quantity), 0)', 'totalMoneyFinal')
            .addSelect('flashSaleCampaign.id', 'flashSaleCampaignId')
            .addSelect('flashSaleCampaign.name', 'flashSaleCampaignName')
            .addSelect('flashSaleCampaign.startAt', 'flashSaleCampaignStartAt')
            .addSelect('flashSaleCampaign.endAt', 'flashSaleCampaignEndAt')
            .offset((page - 1) * limit)
            .limit(limit)
            .groupBy('flashSaleCampaign.id')
            .orderBy('flashSaleCampaign.id', 'DESC')
            .getRawMany();

        const totalQuery = query.clone()
            .select('COUNT(*)', 'total')

        const resultTotal = await totalQuery.getRawOne()

        return {
            flashSaleCampaigns,
            total: resultTotal?.total || 0
        }
    }

    /**
    * xử lý kho khi hoàn thành đơn
    */
    async handleWhenCompleteOrder(orderId: number) {
        const order = await Order.createQueryBuilder('order')
            .innerJoinAndSelect('order.details', 'orderDetail')
            .innerJoinAndSelect('orderDetail.flashSaleCampaignDetail', 'flashSaleCampaignDetail')
            .where('order.id = :orderId', { orderId })
            .getOne()

        if (order) {
            for (const detail of order.details) {
                const { flashSaleCampaignDetail } = detail
                await FlashSaleCampaignDetail.createQueryBuilder()
                    .update()
                    .set({
                        pending: () => `pending - ${detail.quantity}`,
                        sold: () => `sold + ${detail.quantity}`,
                    })
                    .where('id = :id', { id: flashSaleCampaignDetail.id })
                    .execute()
            }
        }

    }

    /**
    * xử lý kho khi tạo đơn
    */
    async handleWhenCreateOrder(orderId: number) {
        const order = await Order.createQueryBuilder('order')
            .innerJoinAndSelect('order.details', 'orderDetail')
            .innerJoinAndSelect('orderDetail.flashSaleCampaignDetail', 'flashSaleCampaignDetail')
            .where('order.id = :orderId', { orderId })
            .getOne()

        if (!order) {
            console.error("*** flashSaleService handleWhenCreateOrder not found ***")
            return;
        }

        for (const detail of order.details) {
            const { flashSaleCampaignDetail } = detail
            await FlashSaleCampaignDetail.createQueryBuilder()
                .update()
                .set({
                    pending: () => `pending + ${detail.quantity}`
                })
                .where('id = :id', { id: flashSaleCampaignDetail.id })
                .execute()
        }
    }

    /**
     * xử lý kho khi hủy đơn
     */
    async handleWhenCancelOrder(orderId: number) {
        const order = await Order.createQueryBuilder('order')
            .innerJoinAndSelect('order.details', 'orderDetail')
            .innerJoinAndSelect('orderDetail.flashSaleCampaignDetail', 'flashSaleCampaignDetail')
            .where('order.id = :orderId', { orderId })
            .getOne()

        for (const detail of order.details) {
            const { flashSaleCampaignDetail } = detail
            await FlashSaleCampaignDetail.createQueryBuilder()
                .update()
                .set({
                    pending: () => `pending - ${detail.quantity}`
                })
                .where('id = :id', { id: flashSaleCampaignDetail.id })
                .execute()
        }
    }

    async validate(flashSaleCampaign: FlashSaleCampaign, store: Store) {
        if (flashSaleCampaign.startAt > flashSaleCampaign.endAt) {
            throw new BadRequest("Ngày bắt đầu và kết thúc không hợp lệ!");
        }

        const {
            startAt,
            endAt,
            flashSaleCampaignDetails
        } = flashSaleCampaign


        let where = `flashSaleCampaign.isDeleted = 0 AND (${startAt} BETWEEN flashSaleCampaign.startAt AND flashSaleCampaign.endAt OR ${endAt} BETWEEN flashSaleCampaign.startAt AND flashSaleCampaign.endAt OR (${startAt} <= flashSaleCampaign.startAt AND ${endAt} >= flashSaleCampaign.endAt))`

        if (store) {
            where += ` AND store.id = ${store.id}`;
        }

        if (flashSaleCampaign.id) {
            where += ` AND flashSaleCampaign.id != ${flashSaleCampaign.id}`;
        }

        //validate campaign
        const otherFlashSaleCampaign = await FlashSaleCampaign.createQueryBuilder('flashSaleCampaign')
            .leftJoin('flashSaleCampaign.store', 'store')
            .where(where)
            .getOne()

        if (otherFlashSaleCampaign) {
            throw new BadRequest("Chiến dịch FlashSale chỉ tồn tại 01 chiến dịch duy nhất tại một thời điểm");
        }

        //validate với promotion (giảm giá sp theo %)
        let wherePromotion = `promotionCampaign.isDeleted = 0 AND product.id IN (:...productIds) AND promotionCampaign.conditionType = :conditionType AND promotionCampaign.discountType = :discountType AND promotionCampaign.isDeleted = 0 AND promotionCampaignDetail.isGift = 0`
        if (store) {
            wherePromotion += ` AND store.id = :storeId`;
        }

        // console.log('validate flash sale productIds:', flashSaleCampaignDetails.map(e => e.product.id));


        const queryPromotionCampaignDetail = PromotionCampaignDetail.createQueryBuilder('promotionCampaignDetail')
            .innerJoinAndSelect('promotionCampaignDetail.product', 'product')
            .leftJoinAndSelect('promotionCampaignDetail.promotionCampaign', 'promotionCampaign')
            .leftJoin('promotionCampaign.store', 'store')
            .where(`(${startAt} BETWEEN promotionCampaign.startAt AND promotionCampaign.endAt OR ${endAt} BETWEEN promotionCampaign.startAt AND promotionCampaign.endAt OR (${startAt} <= promotionCampaign.startAt AND ${endAt} >= promotionCampaign.endAt))`)
            .andWhere(wherePromotion, {
                productIds: flashSaleCampaignDetails.map(e => e.product.id),
                conditionType: PromotionConditionType.SomeProduct,
                discountType: PromotionDiscountType.Percent,
                storeId: store.id
            })

        // console.log('queryPromotionCampaignDetail', queryPromotionCampaignDetail.getQuery());


        const promotionCampaignDetails = await queryPromotionCampaignDetail
            .getMany()

        for (const detail of promotionCampaignDetails) {
            throw new BadRequest(`${detail.product.name} đang trong chiến dịch khuyến mãi '${detail.promotionCampaign.name}- #${detail.promotionCampaign.code}'`);
        }
        //
    }


} //END FILE
