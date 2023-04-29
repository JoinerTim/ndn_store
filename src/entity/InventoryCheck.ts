import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";

import { addPrefix, leftPad } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { Depot } from "./Depot";
import { InventoryDetail } from "./InventoryDetail";
import { Staff } from "./Staff";
import { INVENTORY_CHECK, INVENTORY_EXPORT, INVENTORY_IMPORT } from "../enum";
import { Order } from "./Order";
import { Employee } from "./Employee";
import { Store } from "./Store";
import { InventoryCheckDetail } from "./InventoryCheckDetail";

export enum InventoryCheckStatus {
    Pending = 'PENDING',
    Complete = 'COMPLETE'
}

@Entity(addPrefix("inventory_check"))
export class InventoryCheck extends CoreEntity {
    constructor() {
        super()
    }


    // PROPERTIES
    @Column({ default: '' })
    @Property()
    code: string;

    @Column({ default: InventoryCheckStatus.Pending, type: 'enum', enum: InventoryCheckStatus })
    status: InventoryCheckStatus;

    @Column({ default: '' })
    @Property()
    note: string;

    @Column({ default: 0 })
    @Property()
    checkAt: number;

    @Column({ default: 0 })
    @Property()
    totalStock: number;

    @Column({ default: 0 })
    @Property()
    totalReal: number;

    @Column({ default: 0 })
    @Property()
    totalMoneyDiff: number;


    // RELATIONS

    @ManyToOne(() => Employee, employee => employee.inventoryCheckCreated)
    createdEmployee: Employee;

    @ManyToOne(() => Employee, employee => employee.inventoryChecked)
    checkedEmployee: Employee;

    @ManyToOne(() => Depot, depot => depot.inventoryChecks)
    depot: Depot;

    @OneToMany(() => InventoryCheckDetail, inventoryCheckDetail => inventoryCheckDetail.inventoryCheck, {
        onDelete: 'CASCADE'
    })
    inventoryCheckDetails: InventoryCheckDetail[];

    @ManyToOne(() => Store, store => store.inventories)
    store: Store;

    // METHODS
    public async assignDepot(depotId: number, store: Store) {
        const depot = await Depot.findOneOrThrowOption({ where: { id: depotId, store } })
        this.depot = depot
    }

    public async assignStore(storeId: number) {
        const store = await Store.findOneOrThrowId(storeId, null, '')
        this.store = store
    }

    async generateCode() {
        const count = await InventoryCheck.count()

        let prefix = INVENTORY_CHECK

        this.code = prefix + leftPad(count + 1, 5);
    }

} // END FILE
