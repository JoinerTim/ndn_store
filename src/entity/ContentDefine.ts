import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';

export enum ContentDefineType {
    HowToUseApp = 'HOW_TO_USE_APP', //hd sử dụng
    DeliveryPolicy = 'DELIVERY_POLICY', //Chính sách giao hàng
    TermOfPayment = 'TERM_OF_PAYMENT',//quy trình thanh toán
    Policy = 'POLICY', //Chính sách bảo mật
    HowToUpgradeRank = 'HOW_TO_UPGRADE_RANK', //Hướng dẫn cách thăng hạng
}

@Entity(addPrefix("content_define"))
export class ContentDefine extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @Column({ type: "longtext" })
    @Property()
    body: string

    @Column()
    @Property()
    type: string;
    // RELATIONS


    // METHODS


} // END FILE
