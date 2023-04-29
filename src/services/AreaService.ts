// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { Area } from "../entity/Area";

interface AreaQuery {
    page: number;
    limit: number
    search?: string
}

@Service()
export class AreaService {

    async getManyAndCount({
        page,
        limit,
        search = '',
    }: AreaQuery) {
        let where = `area.name LIKE :search AND area.isDeleted = false`;

        const [areas, total] = await Area.createQueryBuilder('area')
            .where(where, { search: `%${search}%` })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('area.id', 'DESC')
            .getManyAndCount()

        return { areas, total }
    }

} //END FILE
