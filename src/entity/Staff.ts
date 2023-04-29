// IMPORT LIBRARY
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/schema";

// IMPORT CUSTOM
import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Role } from "./Role";
import { Store } from "./Store";
import { Inventory } from "./Inventory";
import { Conversation } from "./Conversation";
import { OneSignal } from "./OneSignal";
import { ConversationParticipant } from "./ConversationParticipant";

@Entity(addPrefix("staff"))
export class Staff extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @Column({ unique: false })
    @Property()
    username: string;

    @Column({ select: false })
    @Property()
    password: string;

    @Column({ default: "" })
    @Property()
    name: string;

    @Column({ default: "" })
    @Property()
    avatar: string;

    @Column({ default: "" })
    @Property()
    phone: string

    @Column({ default: "" })
    @Property()
    email: string

    @Column({ default: false })
    @Property()
    isBlocked: boolean

    @Column({ default: '' })
    @Property()
    companyName: string; //đơn vị chủ quản

    @ManyToOne(() => Store, store => store.staffs)
    store: Store;

    @OneToMany(() => Inventory, inventory => inventory.staff)
    inventories: Inventory[];

    @OneToMany(() => Inventory, completedInventory => completedInventory.completedStaff)
    completedInventories: Inventory[];

    @OneToMany(() => Conversation, conversation => conversation.staff)
    conversations: Conversation[];

    @OneToMany(() => OneSignal, oneSignal => oneSignal.staff)
    oneSignals: OneSignal[];

    // RELATIONS

    @ManyToOne(type => Role, role => role.staff)
    role: Role;

    @OneToMany(() => ConversationParticipant, conversationParticipant => conversationParticipant.staff)
    conversationParticipants: ConversationParticipant[];

    // METHODS
    public async assignRole(roleId: number) {
        const role = await Role.findOneOrThrowId(roleId, null, '')
        this.role = role
    }

    public async assignStore(storeId: number) {
        const store = await Store.findOneOrThrowId(storeId, null, '')
        this.store = store
    }

} // END FILE
