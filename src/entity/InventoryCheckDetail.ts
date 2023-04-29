import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Product } from "./Product";
import { Inventory } from "./Inventory";
import { Property } from "@tsed/schema";
import { Store } from "./Store";
import { Depot } from "./Depot";
import { BadRequest } from "@tsed/exceptions";
import { InventoryCheck } from "./InventoryCheck";

@Entity(addPrefix("inventory_check_detail"))
export class InventoryCheckDetail extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: 0 })
    @Property()
    quantity: number;

    @Column({ default: 0 })
    @Property()
    stock: number; //sl tồn tại thời điểm phát sinh record

    @Column({ type: 'text', nullable: true })
    @Property()
    note: string;

    @Property()
    productId: number

    @Column({ default: 0, type: 'double' })
    @Property()
    moneyDiff: number;

    // RELATIONS
    @ManyToOne(() => Product, product => product, {
        onDelete: 'CASCADE'
    })
    product: Product;

    @ManyToOne(() => InventoryCheck, inventoryCheck => inventoryCheck.inventoryCheckDetails, {
        onDelete: 'CASCADE'
    })
    inventoryCheck: InventoryCheck;

    // METHODS
    public async assignProduct(productId: number, store: Store, depot: Depot) {
        const product = await Product.createQueryBuilder('product')
            .leftJoinAndSelect('product.store', 'store')
            .leftJoinAndSelect('product.warehouses', 'warehouses')
            .leftJoinAndSelect('warehouses.depot', 'depot')
            .where('product.isDeleted = false AND product.id = :productId AND store.id = :storeId AND depot.id = :depotId', { productId, storeId: store.id, depotId: depot.id })
            .getOne()

        if (!product) {
            throw new BadRequest("Sản phẩm không tồn tại.")
        }
        this.product = product
    }


} // END FILE
