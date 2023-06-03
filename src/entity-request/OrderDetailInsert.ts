// IMPORT LIBRARY
import { BadRequest } from "@tsed/exceptions";
import { Property, Required } from "@tsed/schema";
// IMPORT CUSTOM
import { OrderDetail } from '../entity/OrderDetail';

export class OrderDetailInsert {
    // Transform to draw entity
    async toOrderDetail(customerId?: number) {
        const orderDetail = new OrderDetail();

        await orderDetail.assignProduct(this.productId);
        orderDetail.isProductDeleted = orderDetail.product.isDeleted;

        orderDetail.name = this.name
        orderDetail.quantity = this.quantity || 0;
        orderDetail.discount = this.discount || 0;
        orderDetail.discountCoupon = 0;
        orderDetail.discountFlashSale = this.discountFlashSale || 0;
        orderDetail.price = orderDetail.product.unitPrice;

        if (this.productVariationId) await orderDetail.assignProductVariation(this.productVariationId)

        if (this.flashSaleCampaignDetailId) await orderDetail.assignFlashSaleCampaignDetail(this.flashSaleCampaignDetailId)

        if (this.promotionCampaignDetailId) {
            await orderDetail.assignPromotionCampaignDetail(this.promotionCampaignDetailId);
        }

        if (this.refCustomerId && customerId && this.refCustomerId !== customerId) await orderDetail.assignRefCustomer(this.refCustomerId)

        if (orderDetail.discount && !this.promotionCampaignDetailId) {
            throw new BadRequest(`Sản phẩm ${orderDetail.product.name} không được giảm giá.`);
        }

        if (orderDetail.discountFlashSale && !this.flashSaleCampaignDetailId) {
            throw new BadRequest(`Sản phẩm ${orderDetail.product.name} không được áp dụng FlashSale.`);
        }

        if (this.giftPromotionCampaignDetailId) {
            await orderDetail.assignGiftPromotionCampaignDetail(this.giftPromotionCampaignDetailId)
            if (orderDetail.giftPromotionCampaignDetail.product.id != this.productId) {
                throw new BadRequest(`Khuyến mãi tặng kèm không dành cho sản phảm '${orderDetail.product.name}'`);
            }
        }

        if (orderDetail.flashSaleCampaignDetail && orderDetail.flashSaleCampaignDetail.pending + orderDetail.flashSaleCampaignDetail.sold + orderDetail.quantity > orderDetail.flashSaleCampaignDetail.stock) {
            orderDetail.isOutOfStockFlashSale = true
        }

        if (orderDetail.flashSaleCampaignDetail && orderDetail.flashSaleCampaignDetail.stock >= orderDetail.flashSaleCampaignDetail.pending + orderDetail.flashSaleCampaignDetail.sold + orderDetail.quantity) {
            orderDetail.discountFlashSale = orderDetail.quantity * (orderDetail.product.finalPrice - orderDetail.flashSaleCampaignDetail.finalPrice)
        }

        let orderPriceFlashsale = 0

        if (orderDetail.flashSaleCampaignDetail && orderDetail.flashSaleCampaignDetail.stock >= orderDetail.flashSaleCampaignDetail.pending + orderDetail.flashSaleCampaignDetail.sold + orderDetail.quantity) {
            orderPriceFlashsale = orderDetail.flashSaleCampaignDetail.finalPrice;
        } else {
            orderPriceFlashsale = orderDetail.product.unitPrice;
        }

        orderDetail.price = orderDetail.product.unitPrice;
        orderDetail.finalPrice = orderPriceFlashsale - orderDetail.discount - orderDetail.discountCoupon
        return orderDetail
    }

    // PROPERTIES
    @Property()
    discount: number;

    @Property()
    discountFlashSale: number;

    @Property()
    @Required()
    quantity: number;

    @Property()
    @Required()
    productId: number;

    @Property()
    name: string;

    @Property()
    length: number;

    @Property()
    width: number;

    @Property()
    height: number;

    @Property()
    weight: number;

    @Property()
    productVariationId: number

    @Property()
    promotionCampaignDetailId: number //giảm giá

    @Property()
    flashSaleCampaignDetailId: number

    @Property()
    giftPromotionCampaignDetailId: number //tặng kèm

    @Property()
    refCustomerId: number
} // END FILE
