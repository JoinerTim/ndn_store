// IMPORT LIBRARY
import { Property } from "@tsed/schema";

// IMPORT CUSTOM
import { CouponCampaignDetail } from '../entity/CouponCampaignDetail';

export class CouponCampaignDetailInsert {
    // Transform to draw entity
    async toCouponCampaignDetail() {
        const couponCampaignDetail = new CouponCampaignDetail()

        couponCampaignDetail.id = this.id;
        couponCampaignDetail.stock = this.stock
        await couponCampaignDetail.assignProduct(this.productId)

        return couponCampaignDetail
    }

    // PROPERTIES
    @Property()
    id: number

    @Property()
    stock: number

    @Property()
    productId: number

} // END FILE
