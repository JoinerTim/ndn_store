import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Store } from "./Store";


export enum ConfigurationParam {
    // ShipFeeFromFactory = 'SHIP_FEE_FROM_FACTORY', // phí ship từ nhà máy
    PointRefundRate = 'POINT_REFUND_RATE', //tỷ lệ hoàn điểm 0 -> 1 (100%)
    RewardPoint = 'REWARD_POINT', //số điểm nhận đc khi đánh giá đơn hàng
    ShipFeeFromStore = "SHIP_FEE_FROM_STORE", //phí ship từ cửa hàng
    RefRegisterPoint = "REF_REGISTER_POINT", //điểm hoa hồng từ cửa hàng
}

export enum ConfigurationDataType {
    Number = 'NUMBER',
    String = 'STRING',
}

@Entity(addPrefix("configuration"))
export class Configuration extends CoreEntity {

    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ type: 'enum', enum: ConfigurationParam })
    @Property()
    param: ConfigurationParam;

    @Column({ default: '' })
    @Property()
    title: string;

    @Column({ default: '' })
    @Property()
    image: string;

    @Column({ nullable: true, type: 'text' })
    @Property()
    value: string;

    @Column({ default: '' })
    @Property()
    version: string;

    @Column({ default: true })
    @Property()
    isEnable: boolean;

    @Column({ default: '' })
    @Property()
    dataType: ConfigurationDataType;

    // RELATIONS
    @ManyToOne(() => Store, store => store.configurations)
    store: Store;

    // METHODS


} // END FILE


