import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { City } from "./City";
import { District } from "./District";
import { Ward } from "./Ward";
import { Customer } from "./Customer";


export enum DeliveryAddressType {
    Home = 'HOME',
    Office = 'OFFICE'
}

/**
 * Địa chỉ giao hàng
 */
@Entity(addPrefix("delivery_address"))
export class DeliveryAddress extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: '' })
    @Property()
    phone: string;

    @Column({ default: '' })
    @Property()
    address: string;

    @Column({ default: false })
    @Property()
    isDefault: boolean;

    @Column({ default: DeliveryAddressType.Home, type: 'enum', enum: DeliveryAddressType })
    @Property()
    type: DeliveryAddressType;

    // RELATIONS
    @ManyToOne(() => City)
    city: City;

    @ManyToOne(() => District)
    district: District;

    @ManyToOne(() => Ward)
    ward: Ward;

    @ManyToOne(() => Customer, customer => customer.deliveryAddresses)
    customer: Customer;

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
