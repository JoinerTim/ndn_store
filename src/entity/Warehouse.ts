import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { Product } from "./Product";
import { Depot } from "./Depot";
import { Store } from "./Store";

@Entity(addPrefix("warehouse"))
export class Warehouse extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: 0 })
    @Property()
    quantity: number;

    @Column({ default: 0 })
    @Property()
    pending: number; //sl tồn đang chờ xuất, đã ra đơn nhưng chưa hoàn tất=

    @Column({ default: 0 })
    @Property()
    sold: number;

    @Column({ type: 'text', nullable: true })
    @Property()
    location: string;

    @Column({ default: false })
    @Property()
    isOutOfStock: boolean;

    @Column({ default: 0 })
    @Property()
    minimumStock: number;

    // RELATIONS
    @ManyToOne(() => Product, product => product.warehouses, { onDelete: 'CASCADE' })
    product: Product;

    @ManyToOne(() => Depot, depot => depot.warehouses)
    depot: Depot;
    // METHODS

    public async assignProduct(productId: number) {
        const product = await Product.findOneOrThrowId(productId, null, '')
        this.product = product
    }

    public async assignDepot(depotId: number, store: Store) {
        const depot = await Depot.findOneOrThrowOption({ where: { store, id: depotId } })
        this.depot = depot
    }

} // END FILE
