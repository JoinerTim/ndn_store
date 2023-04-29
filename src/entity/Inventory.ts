import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";

import { addPrefix, leftPad } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { Depot } from "./Depot";
import { InventoryDetail } from "./InventoryDetail";
import { Staff } from "./Staff";
import { INVENTORY_EXPORT, INVENTORY_IMPORT } from "../enum";
import { Order } from "./Order";
import { Employee } from "./Employee";
import { Store } from "./Store";

export enum InventoryType {
    Import = 'IMPORT',
    Export = 'EXPORT',
    Change = 'CHANGE'
}

export enum InventoryStatus {
    Pending = 'PENDING',
    Complete = 'COMPLETE'
}

@Entity(addPrefix("inventory"))
export class Inventory extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    code: string;

    @Column({ default: InventoryType.Import, type: 'enum', enum: InventoryType })
    @Property()
    type: InventoryType;

    @Column({ default: InventoryStatus.Pending, type: 'enum', enum: InventoryStatus })
    status: InventoryStatus;

    @Column({ default: '' })
    @Property()
    note: string;

    @Column({ default: 0 })
    @Property()
    completedAt: number;


    // RELATIONS
    @ManyToOne(() => Staff, staff => staff.inventories)
    staff: Staff;

    @ManyToOne(() => Employee, employee => employee.inventories)
    employee: Employee;

    @ManyToOne(() => Employee, completedEmployee => completedEmployee.completedInventories)
    completedEmployee: Employee;

    @ManyToOne(() => Staff, completedStaff => completedStaff.completedInventories)
    completedStaff: Staff;

    @ManyToOne(() => Depot, depot => depot.inventories)
    depot: Depot;

    @ManyToOne(() => Depot)
    toDepot: Depot;//kho chuyển tới, dành cho phiếu chuyển kho

    @OneToMany(() => InventoryDetail, inventoryDetail => inventoryDetail.inventory, {
        onDelete: 'CASCADE'
    })
    inventoryDetails: InventoryDetail[];

    @ManyToOne(() => Order, order => order.inventories)
    order: Order;

    @ManyToOne(() => Store, store => store.inventories)
    store: Store;

    // METHODS
    public async assignDepot(depotId: number, store: Store) {
        const depot = await Depot.findOneOrThrowOption({ where: { id: depotId, store } })
        this.depot = depot
    }

    public async assignToDepot(depotId: number) {
        const depot = await Depot.findOneOrThrowId(depotId, null, '')
        this.toDepot = depot
    }

    public async assignStore(storeId: number) {
        const store = await Store.findOneOrThrowId(storeId, null, '')
        this.store = store
    }

    async generateCode() {
        const count = await Inventory.count()

        let prefix = ''
        switch (this.type) {
            case InventoryType.Import:
                prefix = INVENTORY_IMPORT
                break;

            case InventoryType.Export:
                prefix = INVENTORY_EXPORT
                break;
            default:
                break;
        }

        this.code = prefix + leftPad(count + 1, 5);
    }

} // END FILE
