import { Entity, Column, OneToMany, Tree, TreeChildren, TreeParent, ManyToOne } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Product } from "./Product";
import { Store } from "./Store";

export enum ProductCategoryType {
    Menu = 'MENU',
    Category = 'CATEGORY',
    Brand = 'BRAND',//
    Taxonomy = 'TAXONOMY', // ngành hàng
}

@Entity(addPrefix("product_category"))
@Tree("materialized-path")
export class ProductCategory extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    code: string;

    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: '' })
    @Property()
    nameEn: string; //tên tiếng anh

    @Column({ default: '' })
    @Property()
    icon: string;

    @Column({ default: 0 })
    @Property()
    level: number;

    @Column({ default: '' })
    @Property()
    slug: string;

    @Column({ default: 0, type: 'double' })
    @Property()
    refPoint: number; //thưởng điểm hoa hồng khi chia sẻ mua hàng, tính theo %

    @Column({ default: true })
    @Property()
    isVisible: boolean;

    @Column({ default: '' })
    @Property()
    metaKeyword: string;

    @Column({ default: true })
    @Property()
    visibleOnMenu: boolean; //hiển thị trên menu

    @Column({ default: false })
    @Property()
    isHighlight: boolean; //true: cate nổi bật, hiển thị dạng list + product ở mobile

    @Column({ enum: ProductCategoryType, type: 'enum', default: ProductCategoryType.Category })
    @Property()
    type: ProductCategoryType;

    @Column({ default: 0 })
    @Property()
    position: number;

    @Column({ nullable: true, type: 'text' })
    @Property()
    description: string;

    // RELATIONS
    @TreeChildren()
    children: ProductCategory[]

    @TreeParent()
    parent: ProductCategory

    @OneToMany(() => Product, mainProduct => mainProduct.productCategory)
    products: Product[];

    @ManyToOne(() => Store, store => store.productCategories)
    store: Store;

    // METHODS
    async generateCode() {
        this.code = '';
    }

    public async assignParent(parentId: number) {
        const parent = await ProductCategory.findOneOrThrowId(parentId, null, '')
        this.parent = parent
    }

} // END FILE
