import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";


import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { Product } from "./Product";
import { OrderDetail } from "./OrderDetail";

@Entity(addPrefix("product_variation"))
export class ProductVariation extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string

    @Column({ default: false })
    @Property()
    isMain: boolean; //true: lấy giá của biến thể này để show ra UI khi search, hoặc tự select

    @Column({ default: 0 })
    @Property()
    available: number; //sl tồn kho có thể 

    @Column({ default: 0, type: 'double' })
    @Property()
    unitPrice: number; //giá bán lẻ

    @Column({ default: 0, type: 'double' })
    @Property()
    wholePrice: number; //giá buôn

    @Column({ default: 0, type: 'double' })
    @Property()
    shockPrice: number; //giá shock

    @Column({ default: 0, type: 'double' })
    @Property()
    importPrice: number; //giá nhập (bán cho khách purchasing)

    @Column({ default: 0, type: 'double' })
    @Property()
    eCardFee: number; //phí suất nếu bán dạng E-Card (dvt: %)

    // RELATIONS

    @ManyToOne(() => Product, product => product.productVariations)
    product: Product;

    @OneToMany(() => OrderDetail, orderDetail => orderDetail.productVariation)
    orderDetails: OrderDetail[];
    // METHODS


} // END FILE
