import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Customer } from "./Customer";
import { CustomerRank } from "./CustomerRank";
import { Store } from "./Store";

@Entity(addPrefix("upgrade_rank_history"))
export class UpgradeRankHistory extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: 0, type: 'bigint' })
    @Property()
    afterPoints: number; //số điểm sau khi upgrade

    @Column({ default: 0, type: 'bigint' })
    @Property()
    beforePoints: number; //số điểm trước khi upgrade

    @Column({ default: 0 })
    @Property()
    nextRankPoints: number; //số điểm của rank kế tiếp

    // RELATIONS
    @ManyToOne(() => Customer, customer => customer)
    customer: Customer;

    @ManyToOne(() => CustomerRank)
    preRank: CustomerRank;

    @ManyToOne(() => CustomerRank)
    nextRank: CustomerRank;

    @ManyToOne(() => Store, store => store.upgradeRankHistories)
    store: Store;

    // METHODS


} // END FILE
