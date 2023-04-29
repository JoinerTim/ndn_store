// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { UpgradeRankHistory } from "../entity/UpgradeRankHistory";

interface UpgradeRankHistoryQuery {
    page: number;
    limit: number
    search?: string
}

@Service()
export class UpgradeRankHistoryService {

    async create({
        customer,
        afterPoints,
        beforePoints,
        nextRankPoints,
        preRank,
        nextRank,
        store
    }: Partial<UpgradeRankHistory>) {
        const upgradeRankHistory = new UpgradeRankHistory()
        upgradeRankHistory.customer = customer
        upgradeRankHistory.afterPoints = afterPoints
        upgradeRankHistory.beforePoints = beforePoints
        upgradeRankHistory.nextRankPoints = nextRankPoints
        upgradeRankHistory.preRank = preRank
        upgradeRankHistory.nextRank = nextRank
        upgradeRankHistory.store = store

        await upgradeRankHistory.save()
        return upgradeRankHistory;
    }

    async getManyAndCount({
        page,
        limit,
        search = '',
    }: UpgradeRankHistoryQuery) {
        let where = `upgradeRankHistory.isDeleted = false`;

        const [upgradeRankHistories, total] = await UpgradeRankHistory.createQueryBuilder('upgradeRankHistory')
            .where(where, { search: `%${search}%` })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('upgradeRankHistory.id', 'DESC')
            .getManyAndCount()

        return { upgradeRankHistories, total }
    }

} //END FILE
