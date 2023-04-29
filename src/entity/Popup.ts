import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Product } from "./Product";
import { Store } from "./Store";

export enum PopupType {
    Content = 'CONTENT', // N.dung cứng
    Link = 'LINK', // L.kết ngoài
    Shop = 'Shop', // Cửa hàng
    Product = 'PRODUCT', // s.phẩm
}

export enum PopupPlatform {
    Web = 'WEB',
    Mobile = 'MOBILE'
}

@Entity(addPrefix("popup"))
export class Popup extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    title: string;

    @Column({ nullable: true, type: 'text' })
    @Property()
    content: string;

    @Column({ default: PopupPlatform.Mobile, type: 'enum', enum: PopupPlatform })
    @Property()
    platform: PopupPlatform;

    @Column({ default: '' })
    @Property()
    image: string;

    @Column({ default: '' })
    @Property()
    type: PopupType;

    @Column({ default: '' })
    @Property()
    link: string;

    @Column({ default: true })
    @Property()
    isVisible: boolean;

    // RELATIONS
    @ManyToOne(() => Product)
    product: Product;

    @ManyToOne(() => Store, store => store.popups)
    store: Store;

    // METHODS
    public async assignProduct(productId: number) {
        const product = await Product.findOneOrThrowId(productId, null, '')
        this.product = product
    }

    public async assignStore(storeId: number) {
        const store = await Store.findOneOrThrowId(storeId, null, '')
        this.store = store
    }

} // END FILE
