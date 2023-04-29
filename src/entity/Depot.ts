import { Entity, Column, OneToMany, ManyToOne, OneToOne } from "typeorm";


import { addPrefix, leftPad } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { Warehouse } from "./Warehouse";
import { Inventory } from "./Inventory";
import { Order } from "./Order";
import { Store } from "./Store";
import { City } from "./City";
import { District } from "./District";
import { Ward } from "./Ward";
import { InventoryCheck } from "./InventoryCheck";


@Entity(addPrefix("depot"))
export class Depot extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    code: string;

    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ nullable: true, type: 'text' })
    @Property()
    address: string;



    // RELATIONS
    @OneToMany(() => Warehouse, warehouse => warehouse.depot)
    warehouses: Warehouse[];

    @OneToMany(() => Inventory, inventory => inventory.depot)
    inventories: Inventory[];

    @OneToMany(() => InventoryCheck, inventoryCheck => inventoryCheck.depot)
    inventoryChecks: InventoryCheck[];

    @OneToMany(() => Order, order => order.depot)
    orders: Order[];

    @ManyToOne(() => Store, store => store.depots)
    store: Store;

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

    async generateCode() {
        const count = await Depot.count()
        let prefix = 'KH'
        this.code = prefix + leftPad(count + 1, 5);
    }


} // END FILE
