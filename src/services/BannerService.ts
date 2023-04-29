// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { Banner } from "../entity/Banner";
import { getCurrentTimeInt } from "../util/helper";

interface BannerQuery {
    page: number;
    limit: number
    search?: string;
    isVisible?: boolean
    storeId?: number
}

@Service()
export class BannerService {

    async getManyAndCount({
        page,
        limit,
        search = '',
        isVisible,
        storeId
    }: BannerQuery) {
        let where = `banner.title LIKE :search AND banner.isDeleted = false`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }


        if (typeof isVisible == 'boolean') {
            where += ` AND banner.isVisible = :isVisible`;
        }


        const [banners, total] = await Banner.createQueryBuilder('banner')
            .leftJoinAndSelect('banner.news', 'news')
            .leftJoinAndSelect('banner.store', 'store')
            .where(where, { search: `%${search}%`, isVisible, storeId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('banner.pos', 'ASC')
            .getManyAndCount()

        return { banners, total }
    }

    async getOne(bannerId: number) {
        const banner = await Banner.findOneOrThrowId(bannerId, {
            relations: ['news']
        })
        return banner
    }

} //END FILE
