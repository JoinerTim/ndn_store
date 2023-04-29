import { Entity, Column, ManyToOne, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Product } from "./Product";
import { Store } from "./Store";

export enum TransportSericeType {
    Standard = "STANDARD",
    Economy = "ECONOMY",
    Express = "EXPRESS",
}
@Entity(addPrefix("transport"))
export class Transport extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ enum: TransportSericeType, type: 'enum' })
    @Property()
    type: TransportSericeType;

    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: false })
    @Property()
    isEnabled: boolean;

    @Column({ default: false })
    @Property()
    isCod: boolean;

    //height
    @Column({ default: 0, type: 'double' })
    @Property()
    maxHeight: number;

    @Column({ default: 0, type: 'double' })
    @Property()
    minHeight: number;

    //width
    @Column({ default: 0, type: 'double' })
    @Property()
    maxWidth: number;

    @Column({ default: 0, type: 'double' })
    @Property()
    minWidth: number;

    //weight
    @Column({ default: 0, type: 'double' })
    @Property()
    minWeight: number;

    @Column({ default: 0, type: 'double' })
    @Property()
    maxWeight: number;

    //length
    @Column({ default: 0, type: 'double' })
    @Property()
    minLength: number;

    @Column({ default: 0, type: 'double' })
    @Property()
    maxLength: number;

    // RELATIONS
    @ManyToMany(() => Product, product => product.transports)
    @JoinTable()
    products: Product[];

    @ManyToOne(() => Store, store => store.transports)
    store: Store;

    // METHODS
    public async assignStore(storeId: number) {
        const store = await Store.findOneOrThrowId(storeId, null, '')
        this.store = store
    }

} // END FILE
