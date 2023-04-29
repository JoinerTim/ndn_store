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
import { InventoryCheck, InventoryCheckStatus } from "../entity/InventoryCheck";
import { InventoryCheckDetail } from "../entity/InventoryCheckDetail";
import { Product } from "../entity/Product";

interface InventoryQuery {
    page: number;
    limit: number
    search?: string
    storeId: number
    depotId?: number
    status?: InventoryStatus
    fromAt?: number
    toAt?: number
    createdEmployeeId?: number

}

interface InventoryCheckCreateParams {
    inventoryCheck: InventoryCheck
    inventoryCheckDetails: InventoryCheckDetail[]
    depotId: number
    inventoryCheckId?: number
    store: Store
    employee: Employee
}

@Service()
export class InventoryCheckService {
    constructor() {

    }
    async getManyAndCount({
        page,
        limit,
        search = '',
        storeId,
        depotId,
        status,
        fromAt,
        toAt,
        createdEmployeeId
    }: InventoryQuery) {
        let where = `inventoryCheck.note LIKE :search AND inventoryCheck.isDeleted = false`;

        if (fromAt && toAt) {
            where += ` AND .createdAt BETWEEN ${fromAt} AND ${toAt}`
        }

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        if (depotId) {
            where += ` AND depot.id = :depotId`
        }
        if (status) {
            where += ' AND inventoryCheck.status = :status'
        }

        if (createdEmployeeId) {
            where += ` AND createdEmployee.id = :createdEmployeeId`
        }

        const query = InventoryCheck.createQueryBuilder('inventoryCheck')
            .leftJoinAndSelect('inventoryCheck.depot', 'depot')
            .leftJoinAndSelect('inventoryCheck.store', 'store')
            .leftJoinAndSelect('inventoryCheck.inventoryCheckDetails', 'inventoryCheckDetails')
            .leftJoinAndSelect('inventoryCheckDetails.product', 'product')
            .leftJoinAndSelect('inventoryCheck.createdEmployee', 'createdEmployee')
            .leftJoinAndSelect('inventoryCheck.checkedEmployee', 'checkedEmployee')
            .where(where, { search: `%${search}%`, fromAt, toAt, storeId, depotId, createdEmployeeId, status })
            .skip((page - 1) * limit)
            .take(limit)

        query.addOrderBy('inventoryCheck.id', 'DESC')

        const [inventoryChecks, total] = await query.getManyAndCount()
        return { inventoryChecks, total }

    }

    async getOne(inventoryId: number, store: Store) {
        const inventory = await Inventory.findOneOrThrowId(inventoryId, {
            relations: ["depot", "inventoryCheckDetails", "createdEmployee", "checkedEmployee", "inventoryCheckDetails.product"],
            where: { store }
        })
        return inventory
    }

    async createOrUpdate({ inventoryCheck, inventoryCheckDetails, inventoryCheckId, store, depotId, employee }: InventoryCheckCreateParams): Promise<InventoryCheck> {

        if (inventoryCheckId) {
            await InventoryCheck.findOneOrThrowOption({ where: { id: inventoryCheckId, store } })
            inventoryCheck.id = inventoryCheckId
        }

        inventoryCheck.status = InventoryCheckStatus.Pending
        await inventoryCheck.assignDepot(depotId, store)
        inventoryCheck.createdEmployee = employee



        const inventoryCheckDetailsData = await Promise.all(inventoryCheckDetails.map(async (item) => {
            if (item.quantity <= 0) {
                throw new BadRequest("Quantity không hợp lệ.")
            }
            await item.assignProduct(item.productId, store, inventoryCheck.depot)
            return item
        }))

        await InventoryCheckDetail.save(inventoryCheckDetailsData)

        inventoryCheck.inventoryCheckDetails = inventoryCheckDetailsData
        inventoryCheck.checkAt = 0
        inventoryCheck.store = store
        await inventoryCheck.generateCode()
        await inventoryCheck.save();

        return inventoryCheck
    }

} //END FILE
