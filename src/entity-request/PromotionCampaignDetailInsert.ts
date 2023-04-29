// IMPORT LIBRARY
import { Property } from "@tsed/schema";
import { PromotionCampaign } from "../entity/PromotionCampaign";

// IMPORT CUSTOM
import { PromotionCampaignDetail } from '../entity/PromotionCampaignDetail';

export class PromotionCampaignDetailInsert {
    // Transform to draw entity
    async toPromotionCampaignDetail() {
        const promotionCampaignDetail = new PromotionCampaignDetail()

        promotionCampaignDetail.id = this.id;
        promotionCampaignDetail.isGift = this.isGift
        promotionCampaignDetail.discount = this.discount || 0
        promotionCampaignDetail.price = this.price
        promotionCampaignDetail.finalPrice = this.finalPrice
        promotionCampaignDetail.quantity = this.quantity
        promotionCampaignDetail.needed = this.needed
        promotionCampaignDetail.discountPercent = this.discountPercent;
        await promotionCampaignDetail.assignProduct(this.productId)

        return promotionCampaignDetail
    }

    // PROPERTIES
    @Property()
    id: number

    @Property()
    isGift: boolean

    @Property()
    discount: number //

    @Property()
    discountPercent: number //

    @Property()
    productId: number

    @Property()
    quantity: number

    @Property()
    needed: number

    @Property()
    finalPrice: number;

    @Property()
    price: number;

} // END FILE
