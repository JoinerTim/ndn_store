// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { Customer } from "../entity/Customer";


// IMPORT CUSTOM
import { CustomerRank } from "../entity/CustomerRank";
import { UpgradeRankHistoryService } from "./UpgradeRankHistoryService";

interface CustomerRankQuery {
    page: number;
    limit: number
    search?: string
    storeId: number
}

@Service()
export class CustomerRankService {

    constructor(
        private upgradeRankHistoryService: UpgradeRankHistoryService
    ) {

    }

    async getManyAndCount({
        page,
        limit,
        search = '',
        storeId
    }: CustomerRankQuery) {
        let where = `1`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const [customerRanks, total] = await CustomerRank.createQueryBuilder('customerRank')
            .leftJoinAndSelect('customerRank.store', 'store')
            .where(where, { search: `%${search}%`, storeId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('customerRank.reachedPoint', 'ASC')
            .getManyAndCount()

        return { customerRanks, total }
    }

    async upgradeRank(customerId: number, change = 0) {
        const customer = await Customer.findOneOrThrowId(customerId, {
            relations: ['customerRank', 'store']
        }, '');

        const {
            store
        } = customer

        console.log('upgradeRank customer balance:', customer.totalBalance)

        const customerRanks = await CustomerRank.createQueryBuilder('customerRank')
            .leftJoin('customerRank.store', 'store')
            .orderBy('customerRank.reachedPoint', 'DESC')
            .where('store.id = :storeId', {
                storeId: store.id
            })
            .getMany()

        console.log('[CustomerRankService.upgradeRank]', customerRanks);


        let currentRank: CustomerRank = null
        for (const customerRank of customerRanks) {
            if (customer.totalBalance >= customerRank.reachedPoint) {
                currentRank = customerRank;
                break;
            }
        }

        if (!currentRank) {
            return;
        }

        console.log('[CustomerRankService.upgradeRank] currentRank', currentRank);

        const oldRank = customer.customerRank;
        const newRank = currentRank;

        if (newRank?.id != oldRank?.id && newRank) {
            customer.customerRank = newRank;
            await customer.save();


            this.upgradeRankHistoryService.create({
                customer,
                nextRankPoints: newRank.reachedPoint,
                afterPoints: customer.totalBalance,
                beforePoints: customer.totalBalance - change,
                preRank: oldRank,
                nextRank: currentRank,
                store
            })
        }
    }

} //END FILE
