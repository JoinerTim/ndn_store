// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { Transport } from "../entity/Transport";
import { Store } from "../entity/Store";

interface TransportQuery {
    page: number;
    limit: number;
    search?: string;
    store: Store;
    productId: number
}

@Service()
export class TransportService {

    async getManyAndCount({
        page,
        limit,
        search = '',
        store,
        productId
    }: TransportQuery) {
        let where = `transport.name LIKE :search AND transport.isDeleted = false AND store.id = :storeId`;

        if (productId) {
            where += ` AND products.id = :productId`
        }
        const [transports, total] = await Transport.createQueryBuilder('transport')
            .leftJoinAndSelect('transport.store', 'store')
            .leftJoinAndSelect('transport.products', 'products')
            .where(where, { search: `%${search}%`, storeId: store.id })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('transport.id', 'DESC')
            .getManyAndCount()

        return { transports, total }
    }


    async getOne(transportId: number, storeId: number) {
        const transport = await Transport.createQueryBuilder('transport')
            .leftJoinAndSelect('transport.store', 'store')
            .leftJoinAndSelect('transport.products', 'products')
            .where('transport.isDeleted = false AND transport.id = :transportId AND store.id = :storeId', { transportId, storeId })
            .getOne()
        return transport
    }

} //END FILE
