// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";
import moment from "moment";
import { escape } from "mysql2";


// IMPORT CUSTOM
import { News } from "../entity/News";
import { QueryObject } from "../types/query";
import { getIntervalFromDate } from "../util/helper";

interface NewsQuery {
    page: number;
    limit: number;
    search?: string;
    isVisible?: boolean;
    fromDate?: string;
    toDate?: string
    sortBy?: 'id' | 'position' | 'createdAt'
    newsTagIds?: number[]
    isHighlight?: boolean
    queryObject?: string
    storeId: number
}

@Service()
export class NewsService {

    public async getManyAndCount({
        page, limit, search,
        isVisible,
        fromDate,
        toDate,
        sortBy = 'id',
        newsTagIds,
        isHighlight,
        queryObject,
        storeId
    }: NewsQuery) {
        let where = `news.title LIKE :search AND news.isDeleted = false `

        if (typeof isVisible == 'boolean') {
            where += ` AND news.isVisible = :isVisible`;
        }

        if (fromDate && toDate) {
            const { start, end } = getIntervalFromDate(fromDate, toDate);
            where += ` AND news.createdAt BETWEEN ${start} AND ${end}`
        }

        if (newsTagIds?.length) {
            where += ' AND newsTag.id IN (:...newsTagIds)'
        }

        if (typeof isHighlight == 'boolean') {
            where += ' AND news.isHighlight = :isHighlight'
        }

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const query = News.createQueryBuilder('news')
            .leftJoinAndSelect('news.newsTags', 'newsTag')
            .leftJoinAndSelect('news.store', 'store')
            .where(where, { search: `%${search}%`, isVisible, newsTagIds, isHighlight, storeId })
            .skip((page - 1) * limit)
            .take(limit)

        if (queryObject) {
            const object = JSON.parse(queryObject) as QueryObject[];
            if (!Array.isArray(object)) {
                throw new BadRequest("Query object is not valid");
            }

            for (const item of object) {
                if (item.type == 'sort') {
                    query.addOrderBy(`${item.field}`, item.value)
                }

                else if (item.type == 'single-filter') {
                    // const value = escape(item.value)
                    query.andWhere(`${item.field} LIKE '%${item.value}%'`)
                }

                else if (item.type == 'multi-filter') {
                    const value = item.value.map(e => `${escape(e)}`).join(', ');
                    query.andWhere(`${item.field} IN (${value})`)
                }
            }
        }

        switch (sortBy) {
            case 'id':
                query.addOrderBy('news.id', 'DESC')
                break;

            case 'position':
                query.addOrderBy('news.position', 'ASC')
                break;

            default:
                break;
        }

        const [newses, total] = await query
            .getManyAndCount()

        return { newses, total }
    }

} //END FILE
