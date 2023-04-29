import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany, OneToOne, JoinColumn } from "typeorm";
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { Order } from "./Order";
import { City } from "./City";
import { District } from "./District";
import { Ward } from "./Ward";

export enum OrderReceiptStatus {
    Pending = 'PENDING',
    Complete = 'COMPLETE'
}

/**
 * Thông tin nhận hóa đơn GTGT
 */
@Entity(addPrefix("order_receipt"))
export class OrderReceipt extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: OrderReceiptStatus.Pending, type: 'enum', enum: OrderReceiptStatus })
    status: OrderReceiptStatus;

    @Column({ default: '' })
    @Property()
    companyName: string; //tên đơn vị

    @Column({ default: '' })
    @Property()
    taxCode: string;

    @Column({ default: '' })
    @Property()
    address: string;

    // RELATIONS
    @OneToOne(() => Order, order => order.orderReceipt)
    @JoinColumn()
    order: Order;

    @ManyToOne(() => City)
    city: City;

    @ManyToOne(() => District)
    district: District;

    @ManyToOne(() => Ward)
    ward: Ward;

    // METHODS

    public async assignCity(cityId: number) {
        const city = await City.findOneOrThrowId(cityId, null, '')
        this.city = city
    }

    public async assignDistrict(districtId: number) {
        const district = await District.findOneOrThrowId(districtId, null, '')
        this.district = district
    }

    public async assignWard(wardId: number) {
        const ward = await Ward.findOneOrThrowId(wardId, null, '')
        this.ward = ward
    }


} // END FILE
