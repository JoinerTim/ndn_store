// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { QuickMessage } from "../entity/QuickMessage";

interface QuickMessageQuery {
    page: number;
    limit: number
    search?: string;
    storeId: number
}

@Service()
export class QuickMessageService {

    async getManyAndCount({
        page,
        limit,
        search = '',
        storeId
    }: QuickMessageQuery) {
        let where = `quickMessage.content LIKE :search AND quickMessage.isDeleted = false`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const [quickMessages, total] = await QuickMessage.createQueryBuilder('quickMessage')
            .leftJoin('quickMessage.store', 'store')
            .where(where, { search: `%${search}%`, storeId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('quickMessage.id', 'DESC')
            .getManyAndCount()

        return { quickMessages, total }
    }

} //END FILE
