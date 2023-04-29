// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { Order } from "../entity/Order";
import { Product, ProductMode } from "../entity/Product";

// IMPORT CUSTOM
import { Warehouse } from "../entity/Warehouse";
import { Store } from "../entity/Store";
import { Depot } from "../entity/Depot";
import CoreEntity from "../core/entity/CoreEntity";
import { BadRequest } from "@tsed/exceptions";
import { OrderDetail } from "../entity/OrderDetail";
import { Inventory, InventoryStatus, InventoryType } from "../entity/Inventory";
import moment from "moment";
import { Employee } from "../entity/Employee";
import { InventoryDetail } from "../entity/InventoryDetail";
import { OrderStatus } from "../types/order";

interface WarehouseQuery {
    page: number;
    limit: number
    search?: string
    depotId?: number
}

interface WarehouseCreateParams {
    warehouseData: Warehouse
    store: Store
    warehouseId?: number
}

@Service()
export class WarehouseService {

    async createOrUpdate({
        warehouseData,
        store,
        warehouseId
    }: WarehouseCreateParams) {

        let where = 'warehouse.isDeleted = false'
        if (warehouseId) {
            where += ` AND warehouse.id = :warehouseId`
        }

        if (store) {
            where += ` AND store.id = :storeId`
        }

        let warehouse = await Warehouse.createQueryBuilder('warehouse')
            .leftJoin('depot.store', 'store')
            .where(where, { storeId: store.id, warehouseId })
            .getOne()

        if (!warehouse) {
            warehouse = new Warehouse()
            warehouse.quantity = warehouseData.quantity
            warehouse.pending = warehouseData.pending
            warehouse.location = warehouseData.location
        } else {
            warehouse.quantity += warehouseData.quantity
            warehouse.pending += warehouseData.pending
            warehouse.location = warehouseData.location
        }

        await warehouse.save()
        return warehouse
    }

    /**
    * xử lý kho khi hoàn thành đơn
    */
    async handleWhenCompleteOrder(orderId: number, employee?: Employee) {
        const order = await Order.findOneOrThrowId(orderId, {
            relations: ['details', 'details.product', 'store']
        }, '');

        const inventory = new Inventory()
        inventory.type = InventoryType.Export
        await inventory.generateCode()
        inventory.status = InventoryStatus.Complete
        inventory.note = `Auto generate when complete order.`
        inventory.completedAt = moment().unix()
        inventory.employee = employee
        inventory.completedEmployee = employee
        inventory.order = order
        inventory.store = order.store

        let inventoryDetails: InventoryDetail[] = []

        for (const detail of order.details) {
            const warehouse = await Warehouse.createQueryBuilder('warehouse')
                .leftJoinAndSelect('warehouse.product', 'product')
                .leftJoinAndSelect('warehouse.depot', 'depot')
                .leftJoinAndSelect('depot.store', 'store')
                .where('product.id = :productId', { productId: detail.product.id })
                .getOne();

            if (!inventory.depot) {
                inventory.depot = warehouse.depot
            }

            const stock = warehouse.quantity
            if (warehouse.quantity - detail.quantity <= 0) {
                warehouse.isOutOfStock = true
            }
            warehouse.quantity -= detail.quantity
            warehouse.sold += detail.quantity
            warehouse.pending -= detail.quantity

            warehouse.product.pending -= detail.quantity
            warehouse.product.sold += detail.quantity
            await warehouse.product.save()

            await warehouse.save()

            const inventoryDetail = new InventoryDetail()
            inventoryDetail.quantity = detail.quantity
            inventoryDetail.stock = stock
            inventoryDetail.price = detail.product.importPrice
            inventoryDetail.note = `Auto generate when complete order.`
            inventoryDetail.product = detail.product
            await inventoryDetail.save()
            inventoryDetails.push(inventoryDetail)
        }
        const inventoryDetailsSaved = await InventoryDetail.save(inventoryDetails)
        inventory.inventoryDetails = inventoryDetailsSaved
        await inventory.save()
    }

    /**
     * xử lý kho khi tạo đơn
     */
    async handleWhenCreateOrder(orderDetails: OrderDetail[]) {
        await CoreEntity.connection.transaction(async (transactionalEntityManager) => {
            for (const detail of orderDetails) {
                const warehouse = await Warehouse.createQueryBuilder('warehouse')
                    .leftJoinAndSelect('warehouse.product', 'product')
                    .leftJoinAndSelect('warehouse.depot', 'depot')
                    .where('product.id = :productId', { productId: detail.product.id })
                    .getOne();

                if (warehouse) {
                    if (detail.quantity > warehouse.quantity - warehouse.pending && detail.product.mode === ProductMode.Strict) {
                        throw new BadRequest(`Số lượng hàng trong kho của ${detail.product.name} chỉ còn ${warehouse.quantity - warehouse.pending}.`);
                    }
                    // if (detail.product.mode === ProductMode.Unstrict && detail.quantity > warehouse.quantity) {
                    //     throw new BadRequest(`Số lượng hàng trong kho của ${detail.product.name} chỉ còn ${warehouse.quantity}.`);
                    // }

                    warehouse.pending += detail.quantity;
                    await transactionalEntityManager.save(Warehouse, warehouse);
                    warehouse.product.pending += detail.quantity
                    await transactionalEntityManager.save(Product, warehouse.product);
                }
            }
        });
    }


    /**
     * xử lý kho khi hủy đơn
     */
    async handleWhenCancelOrder(orderId: number) {
        const order = await Order.findOneOrThrowId(orderId, {
            relations: ['details', 'details.product', 'store']
        }, '');

        for (const detail of order.details) {
            const warehouse = await Warehouse.createQueryBuilder('warehouse')
                .leftJoinAndSelect('warehouse.product', 'product')
                .leftJoinAndSelect('warehouse.depot', 'depot')
                .where('product.id = :productId', { productId: detail.product.id })
                .getOne();
            warehouse.pending -= detail.quantity
            warehouse.product.pending -= detail.quantity
            await warehouse.product.save()
            await warehouse.save()
        }
    }

    async getManyAndCount({
        page,
        limit,
        search = '',
        depotId
    }: WarehouseQuery) {
        let where = `warehouse.isDeleted = false`;

        if (depotId) {
            where += ` AND depot.id = :depotId`
        }

        const [warehouses, total] = await Warehouse.createQueryBuilder('warehouse')
            .leftJoinAndSelect('warehouse.product', 'product')
            .leftJoinAndSelect('warehouse.depot', 'depot')
            .where(where, { search: `%${search}%`, depotId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('warehouse.id', 'DESC')
            .getManyAndCount()

        return { warehouses, total }
    }




} //END FILE
