import { Entity, Column, ManyToOne, ManyToMany, OneToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Store } from "./Store";
import { Role } from "./Role";
import { ConversationMessage } from "./ConversationMessage";
import { Notification } from "./Notification";
import { OneSignal } from "./OneSignal";
import { Inventory } from "./Inventory";
import { InventoryCheck } from "./InventoryCheck";

@Entity(addPrefix("employee"))
export class Employee extends CoreEntity {
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
    username: string;

    @Column({ default: '', select: false })
    password: string;

    @Column({ default: false })
    isAdmin: boolean; //admin của cửa hàng

    @Column({ default: false })
    isBlocked: boolean;

    @Column({ default: 0 })
    notificationBadgeCount: number; //Sl thông báo

    @Column({ default: '' })
    deviceId: string;

    // RELATIONS
    @OneToMany(() => OneSignal, oneSignal => oneSignal.customer)
    oneSignals: OneSignal[];

    @OneToMany(() => Inventory, completedInventory => completedInventory.completedEmployee)
    completedInventories: Inventory[];

    @OneToMany(() => Inventory, inventory => inventory.employee)
    inventories: Inventory[];

    @OneToMany(() => InventoryCheck, inventoryCheck => inventoryCheck.checkedEmployee)
    inventoryChecked: InventoryCheck[];

    @OneToMany(() => InventoryCheck, inventoryCheck => inventoryCheck.createdEmployee)
    inventoryCheckCreated: InventoryCheck[];

    @ManyToOne(() => Store, store => store.employees)
    store: Store;

    @ManyToOne(() => Role, role => role.employees)
    role: Role;

    @ManyToMany(() => ConversationMessage, conversationMessage => conversationMessage.seenEmployees)
    seenConversationMessages: ConversationMessage[];

    @ManyToMany(() => Notification, notification => notification.assignedEmployees)
    assignedNotifications: Notification[];

    @ManyToMany(() => Notification, notification => notification.viewedEmployees)
    viewedNotifications: Notification[]; //notifications da xem

    // METHODS
    public async assignStore(storeId: number) {
        const store = await Store.findOneOrThrowId(storeId, null, '')
        this.store = store
    }

    public async assignRole(roleId: number) {
        const role = await Role.findOneOrThrowId(roleId, null, '')
        this.role = role
    }


} // END FILE
