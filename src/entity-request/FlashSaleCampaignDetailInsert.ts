// IMPORT LIBRARY
import { Property } from "@tsed/schema";

// IMPORT CUSTOM
import { FlashSaleCampaignDetail } from '../entity/FlashSaleCampaignDetail';

export class FlashSaleCampaignDetailInsert {
    // Transform to draw entity
    async toFlashSaleCampaignDetail() {
        const flashSaleCampaignDetail = new FlashSaleCampaignDetail()

        flashSaleCampaignDetail.id = this.id
        flashSaleCampaignDetail.stock = this.stock
        flashSaleCampaignDetail.price = this.price
        flashSaleCampaignDetail.finalPrice = this.finalPrice

        await flashSaleCampaignDetail.assignProduct(this.productId)

        return flashSaleCampaignDetail
    }

    // PROPERTIES
    @Property()
    id: number

    @Property()
    price: number

    @Property()
    finalPrice: number

    @Property()
    stock: number; //sl tồn có thể bán

    @Property()
    productId: number


} // END FILE
