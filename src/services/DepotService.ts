// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { Depot } from "../entity/Depot";

interface DepotQuery {
    page: number;
    limit: number
    storeId: number
    search?: string
}

@Service()
export class DepotService {

    async create({
        name,
        code,
        store
    }: Partial<Depot>) {
        const depot = new Depot()
        depot.name = name
        depot.code = code
        depot.store = store
        await depot.save()
        return depot;
    }

    async getManyAndCount({
        page,
        limit,
        search = '',
        storeId
    }: DepotQuery) {
        let where = `depot.name LIKE :search AND depot.isDeleted = false AND store.id = :storeId`;

        const [depots, total] = await Depot.createQueryBuilder('depot')
            .leftJoin('depot.store', 'store')
            .leftJoinAndSelect('depot.warehouses', 'warehouses')
            .leftJoinAndSelect('warehouses.product', 'product')
            .where(where, { search: `%${search}%`, storeId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('depot.id', 'DESC')
            .getManyAndCount()

        return { depots, total }
    }

    async getOne(depotId: number, storeId: number) {
        const depot = await Depot.createQueryBuilder('depot')
            .leftJoinAndSelect('depot.warehouses', 'warehouses')
            .leftJoinAndSelect('warehouses.product', 'product')
            .leftJoin('depot.store', 'store')
            .where('depot.id = :depotId AND store.id = :storeId', { depotId, storeId })
            .getOne()
        return depot
    }

} //END FILE
