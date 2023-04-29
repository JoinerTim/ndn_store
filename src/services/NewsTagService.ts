// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { NewsTag } from "../entity/NewsTag";

interface NewsTagQuery {
    page: number;
    limit: number
    search?: string
    storeId?: number
}

@Service()
export class NewsTagService {

    async getManyAndCount({
        page,
        limit,
        search = '',
        storeId
    }: NewsTagQuery) {
        let where = `newsTag.name LIKE :search AND newsTag.isDeleted = false`;

        if (storeId) {
            where += ` AND store.id = :storeId`;
        }
        const [newsTags, total] = await NewsTag.createQueryBuilder('newsTag')
            .leftJoinAndSelect('newsTag.store', 'store')
            .where(where, { search: `%${search}%`, storeId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('newsTag.id', 'DESC')
            .getManyAndCount()

        return { newsTags, total }
    }

} //END FILE
