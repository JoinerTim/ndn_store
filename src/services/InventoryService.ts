// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { Inventory, InventoryStatus, InventoryType } from "../entity/Inventory";
import { Store } from "../entity/Store";
import { InventoryDetail } from "../entity/InventoryDetail";
import { Depot } from "../entity/Depot";
import { Employee } from "../entity/Employee";
import { BadRequest } from "@tsed/exceptions";
import { QueryObject } from "../types/query";
import { Product } from "../entity/Product";
import { Warehouse } from "../entity/Warehouse";

interface InventoryQuery {
    page: number;
    limit: number
    search?: string
    storeId: number
    depotId?: number
    type?: InventoryType
    status?: InventoryStatus
    productId?: number
    fromAt?: number
    toAt?: number
    employeeId?: number
    queryObject?: string
    ignoreChangeInventory?: boolean

}

interface InventoryCreateParams {
    inventory: Inventory
    inventoryDetails: InventoryDetail[]
    depotId: number
    inventoryId?: number
    store: Store
    employee: Employee
}

@Service()
export class InventoryService {
    constructor() {

    }
    async getManyAndCount({
        page,
        limit,
        search = '',
        storeId,
        depotId,
        type,
        status,
        productId,
        fromAt,
        toAt,
        employeeId,
        queryObject,
        ignoreChangeInventory
    }: InventoryQuery) {
        let where = `inventory.note LIKE :search AND inventory.isDeleted = false AND product.isDeleted = false`;

        if (fromAt && toAt) {
            where += ` AND .createdAt BETWEEN ${fromAt} AND ${toAt}`
        }

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        if (depotId) {
            where += ` AND depot.id = :depotId`
        }

        if (productId) {
            where += ` AND product.id = :productId`
        }

        if (type) {
            where += ' AND inventory.type = :type'
        }

        if (status) {
            where += ' AND inventory.status = :status'
        }

        if (employeeId) {
            where += ` AND employee.id = :employeeId`
        }

        const query = await Inventory.createQueryBuilder('inventory')
            .leftJoinAndSelect('inventory.depot', 'depot')
            .leftJoinAndSelect('inventory.store', 'store')
            .leftJoinAndSelect('inventory.inventoryDetails', 'inventoryDetails')
            .leftJoinAndSelect('inventory.employee', 'employee')
            .leftJoinAndSelect('inventoryDetails.product', 'product')
            .where(where, { search: `%${search}%`, fromAt, toAt, storeId, depotId, productId, type, status, employeeId })
            .skip((page - 1) * limit)
            .take(limit)

        let isHasOrderBy = false

        if (queryObject) {
            const object = JSON.parse(queryObject) as QueryObject[];
            if (!Array.isArray(object)) {
                throw new BadRequest("Query object is not valid");
            }

            for (const item of object) {
                if (item.type == 'sort') {
                    query.addOrderBy(`${item.field}`, item.value)
                    isHasOrderBy = true;

                }

                else if (item.type == 'single-filter') {
                    // const value = escape(item.value)
                    query.andWhere(`${item.field} LIKE '%${item.value}%'`)
                }

                else if (item.type == 'multi-filter') {
                    const value = item.value.map(e => `${escape(e)}`).join(', ');
                    query.andWhere(`${item.field} IN (${value})`)
                }
            }
        }
        if (!isHasOrderBy) {
            query.addOrderBy('inventory.id', 'DESC')
        }
        const [inventories, total] = await query.getManyAndCount()
        return { inventories, total }

    }

    async getOne(inventoryId: number, store: Store) {
        const inventory = await Inventory.findOneOrThrowId(inventoryId, {
            relations: ["depot", "inventoryDetails", "employee", "inventoryDetails.product"],
            where: { store }
        })
        return inventory
    }

    async createOrUpdate({ inventory, inventoryDetails, inventoryId, store, depotId, employee }: InventoryCreateParams): Promise<Inventory> {

        if (inventoryId) {
            await Inventory.findOneOrThrowOption({ where: { id: inventoryId, store } })
            inventory.id = inventoryId
        }

        inventory.status = InventoryStatus.Pending
        await inventory.assignDepot(depotId, store)
        inventory.employee = employee

        const inventoryDetailsData = await Promise.all(inventoryDetails.map(async (item) => {
            const isExistInDepot = await Product.createQueryBuilder('product')
                .leftJoinAndSelect('product.warehouses', 'warehouses')
                .leftJoinAndSelect('warehouses.depot', 'depot')
                .where('product.id = :productId AND product.isDeleted = false AND depot.id = :depotId', { productId: item.productId, depotId })
                .getOne()

            if (!isExistInDepot && inventory.type == InventoryType.Import) {
                const warehouse = new Warehouse()
                warehouse.minimumStock = isExistInDepot.minimumStock
                warehouse.isOutOfStock = isExistInDepot.isOutStock
                warehouse.pending = 0
                warehouse.quantity = isExistInDepot.stock
                warehouse.product = isExistInDepot
                await warehouse.assignDepot(depotId, store)
                await warehouse.save()

            } else if (!isExistInDepot) {
                throw new BadRequest("Sản phẩm không tồn tại ở kho này.")
            }

            await item.assignProduct(item.productId, store, inventory.depot)
            return item
        }))

        const inventoryDetailsDataSave = await InventoryDetail.save(inventoryDetailsData)

        inventory.inventoryDetails = inventoryDetailsDataSave
        inventory.completedAt = 0
        inventory.store = store
        await inventory.generateCode()
        await inventory.save();

        return inventory
    }

} //END FILE
