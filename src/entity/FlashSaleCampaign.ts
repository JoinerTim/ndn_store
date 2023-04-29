import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { FlashSaleCampaignDetail } from "./FlashSaleCampaignDetail";
import { Store } from "./Store";

@Entity(addPrefix("flash_sale_campaign"))
export class FlashSaleCampaign extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: 0 })
    @Property()
    startAt: number; //unix startOf day

    @Column({ default: 0 })
    @Property()
    endAt: number; //unix endOf day

    @Column({ default: false })
    isRefundQuantity: boolean //Đã trả lại sl cho sp khi hết hiệu lực hoặc xóa


    // RELATIONS
    @OneToMany(() => FlashSaleCampaignDetail, flashSaleCampaignDetail => flashSaleCampaignDetail.flashSaleCampaign)
    flashSaleCampaignDetails: FlashSaleCampaignDetail[];

    @ManyToOne(() => Store, store => store.flashSaleCampaigns)
    store: Store;

    // METHODS
    public async assignStore(storeId: number) {
        const store = await Store.findOneOrThrowId(storeId, null, '')
        this.store = store
    }


} // END FILE
