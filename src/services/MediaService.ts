// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { Media } from "../entity/Media";

interface MediaQuery {
    page: number;
    limit: number
    search?: string
    storeId?: number
}

@Service()
export class MediaService {

    async getManyAndCount({
        page,
        limit,
        search = '',
        storeId
    }: MediaQuery) {
        let where = `media.name LIKE :search AND media.isDeleted = false`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const [medias, total] = await Media.createQueryBuilder('media')
            .leftJoin('media.store', 'store')
            .where(where, { search: `%${search}%`, storeId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('media.id', 'DESC')
            .getManyAndCount()

        return { medias, total }
    }

} //END FILE
