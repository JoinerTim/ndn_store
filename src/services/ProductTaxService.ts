// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { ProductTax } from "../entity/ProductTax";

interface ProductTaxQuery {
    page: number;
    limit: number
    search?: string;
    storeId?: number
}

@Service()
export class ProductTaxService {

    async getManyAndCount({
        page,
        limit,
        search = '',
        storeId
    }: ProductTaxQuery) {
        let where = `productTax.name LIKE :search AND productTax.isDeleted = false`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const [productTaxs, total] = await ProductTax.createQueryBuilder('productTax')
            .leftJoinAndSelect('productTax.store', 'store')
            .where(where, { search: `%${search}%`, storeId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('productTax.id', 'DESC')
            .getManyAndCount()

        return { productTaxs, total }
    }

} //END FILE
