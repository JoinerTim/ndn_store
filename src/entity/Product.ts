import { Entity, Column, OneToMany, ManyToOne, Index, ManyToMany, JoinTable, JoinColumn } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Media } from "./Media";
import { ProductCategory } from "./ProductCategory";
import { CustomField } from "./CustomField";
import { ProductVariation } from "./ProductVariation";
import { ProductTag } from "./ProductTag";
import { LikedProduct } from "./LikedProduct";
import { ViewedProduct } from "./ViewedProduct";
import { Warehouse } from "./Warehouse";
import { FlashSaleCampaignDetail } from "./FlashSaleCampaignDetail";
import { CouponCampaignDetail } from "./CouponCampaignDetail";
import { PromotionCampaignDetail } from "./PromotionCampaignDetail";
import { ProductCustomField } from "./ProductCustomField";
import { OrderDetail } from "./OrderDetail";
import { Store } from "./Store";
import { Employee } from "./Employee";
import { ProductTax } from "./ProductTax";
import { ConversationMessage } from "./ConversationMessage";
import { ProductRefPoint } from "./ProductRefPoint";
import { Transport } from "./Transport";

export enum ProductType {
    Main = 'MAIN', //sp chính
}

export enum ProductMode {
    Strict = 'STRICT',
    Unstrict = 'UNSTRICT'
}

export enum DeliveryType {
    FromStore = 'FROM_STORE',//sp giao từ cửa hàng
    FromFactory = 'FROM_FACTORY', //sp giao từ nhà máy
}


@Entity(addPrefix("product"))
export class Product extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    code: string;

    @Column({ default: '' })
    @Property()
    syncId: string;

    @Column({ default: ProductType.Main, type: 'enum', enum: ProductType })
    @Property()
    type: ProductType;

    @Column({ default: DeliveryType.FromStore, type: 'enum', enum: DeliveryType })
    @Property()
    deliveryType: DeliveryType;

    @Column({ default: '' })
    @Property()
    brandName: string;//thương hiệu

    @Column({ default: '' })
    @Index({ fulltext: true })
    @Property()
    name: string;

    @Column({ default: '' })
    @Index({ fulltext: true })
    @Property()
    nameEn: string; //tên tiếng anh

    @Column({ default: 0, type: 'double' })
    @Property()
    unitPrice: number; //giá lẻ

    @Column({ default: 0, type: 'double' })
    @Property()
    finalPrice: number; //giá đã gồm khuyến mãi

    @Column({ default: 0, type: 'double' })
    @Property()
    importPrice: number; //giá nhập kho (vốn)

    @Property()
    stock: number;

    @Property()
    minimumStock: number;

    @Property()
    isOutStock: boolean;

    //quy cách
    @Column({ default: 0, type: 'double' })
    @Property()
    length: number; //cm

    @Column({ default: 0, type: 'double' })
    @Property()
    width: number; //cm

    @Column({ default: 0, type: 'double' })
    @Property()
    height: number; //cm

    @Column({ default: 0, type: 'double' })
    @Property()
    weight: number; //gram

    @Column({ default: 10, type: 'double' })
    @Property()
    taxPercent: number; //thuế(%)

    @Column({ default: '' })
    @Property()
    image: string;

    @Column({ default: 0 })
    @Property()
    sold: number; //sl đã bán

    @Column({ default: 0 })
    @Property()
    pending: number; //sl đã bán nhưng chưa hoàn tất đơn

    @Column({ nullable: true, type: 'text' })
    @Property()
    description: string;

    @Column({ nullable: true, type: 'text' })
    @Property()
    descriptionEn: string;

    @Column({ default: 0 })
    totalStar: number;

    @Column({ default: 0, type: 'double' })
    @Property()
    refPoint: number; //thưởng điểm hoa hồng khi chia sẻ mua hàng, tính theo %

    @Column({ default: 0 })
    totalRate: number;

    @Column({ default: 0 })
    totalLike: number;

    @Column({ default: 0, type: 'bigint' })
    @Property()
    totalView: number;

    @Column({ default: false })
    @Property()
    isHighlight: boolean;

    @Column({ default: true })
    @Property()
    isActive: boolean; //true: hiển thị ở web khách hàng

    @Column({ default: '' })
    @Property()
    videoUrl: string;

    @Column({ type: 'enum', enum: ProductMode, default: ProductMode.Unstrict })
    @Property()
    mode: ProductMode;

    //other
    isLiked?: boolean
    isViewed?: boolean
    isPromotion?: boolean; //true: có giảm theo giá (%)
    isFlashSale?: boolean; //true: có giảm theo flash sale

    // RELATIONS

    @ManyToMany(() => Transport, transport => transport.products)
    transports: Transport[];

    @OneToMany(() => Media, media => media.product)
    images: Media[];

    @OneToMany(() => ConversationMessage, conversationMessage => conversationMessage.product)
    conversationMessages: ConversationMessage[];

    @ManyToOne(() => ProductCategory, productCategory => productCategory.products)
    productCategory: ProductCategory; //main

    @OneToMany(() => ProductCustomField, productCustomField => productCustomField.product)
    productCustomFields: ProductCustomField[];

    @OneToMany(() => ProductVariation, productVariation => productVariation.product)
    productVariations: ProductVariation[];

    @ManyToMany(() => ProductTag, productTag => productTag.products)
    @JoinTable()
    productTags: ProductTag[];

    @OneToMany(() => LikedProduct, likedProduct => likedProduct.product)
    likedProducts: LikedProduct[];

    @OneToMany(() => ViewedProduct, viewedProduct => viewedProduct.product)
    viewedProducts: ViewedProduct[];

    @OneToMany(() => Warehouse, warehouse => warehouse.product)
    warehouses: Warehouse[];

    @OneToMany(() => FlashSaleCampaignDetail, flashSaleCampaignDetail => flashSaleCampaignDetail.product)
    flashSaleCampaignDetails: FlashSaleCampaignDetail[];

    @OneToMany(() => CouponCampaignDetail, couponCampaignDetail => couponCampaignDetail.product)
    couponCampaignDetails: CouponCampaignDetail[];

    @OneToMany(() => PromotionCampaignDetail, promotionCampaignDetail => promotionCampaignDetail.product)
    promotionCampaignDetails: PromotionCampaignDetail[];

    @OneToMany(() => OrderDetail, orderDetail => orderDetail.product)
    orderDetails: OrderDetail[];

    @OneToMany(() => ProductRefPoint, productRefPoint => productRefPoint.product)
    productRefPoints: ProductRefPoint[];

    @ManyToOne(() => Store, store => store)
    store: Store;

    @ManyToOne(() => Employee)
    deletedBy: Employee;

    @ManyToOne(() => ProductTax, productTax => productTax.products)
    productTax: ProductTax;

    // METHODS
    public async assignProductTags(productTagIds: number[]) {
        const productTags = await ProductTag.findByIds(productTagIds);
        this.productTags = productTags
    }

    public async assignTransports(transportIds: number[]) {
        const transports = await Transport.findByIds(transportIds);
        this.transports = transports
    }

    public async assignProductTax(productTaxId: number) {
        const productTax = await ProductTax.findOneOrThrowId(productTaxId, null, '')
        this.productTax = productTax
    }

    public async assignImages(imagePaths: string[]) {
        const medias: Media[] = [];
        for (const path of imagePaths) {
            console.log('path', path)
            const media = new Media();
            media.url = path;
            medias.push(media);
        }

        await Media.save(medias);
        this.images = medias
    }

    public async assignProductCategory(productCategoryId: number) {
        const productCategory = await ProductCategory.findOneOrThrowId(productCategoryId, null, '')
        this.productCategory = productCategory
    }

    public async assignStore(storeId: number) {
        const store = await Store.findOneOrThrowId(storeId, null, '')
        this.store = store
    }

} // END FILE
