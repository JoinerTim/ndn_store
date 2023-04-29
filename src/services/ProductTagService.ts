// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { ProductTag } from "../entity/ProductTag";

interface ProductTagQuery {
    page: number;
    limit: number
    search?: string
    storeId: number
}

@Service()
export class ProductTagService {

    async getManyAndCount({
        page,
        limit,
        search = '',
        storeId
    }: ProductTagQuery) {
        let where = `productTag.name LIKE :search AND productTag.isDeleted = false`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const [productTags, total] = await ProductTag.createQueryBuilder('productTag')
            .leftJoinAndSelect('productTag.store', 'store')
            .where(where, { search: `%${search}%`, storeId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('productTag.id', 'DESC')
            .getManyAndCount()

        return { productTags, total }
    }

} //END FILE
