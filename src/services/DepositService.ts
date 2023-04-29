// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { Deposit } from "../entity/Deposit";

interface DepositQuery {
    page: number;
    limit: number
    search?: string
    customerId?: number
}

@Service()
export class DepositService {

    async getManyAndCount({
        page,
        limit,
        search = '',
        customerId
    }: DepositQuery) {
        let where = `deposit.code LIKE :search AND deposit.isDeleted = false`;

        if (customerId) {
            where += ` AND customer.id = :customerId`
        }

        const [deposits, total] = await Deposit.createQueryBuilder('deposit')
            .leftJoinAndSelect('deposit.customer', 'customer')
            .leftJoinAndSelect('deposit.customerTransaction', 'customerTransaction')
            .where(where, { search: `%${search}%` })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('deposit.id', 'DESC')
            .getManyAndCount()

        return { deposits, total }
    }

} //END FILE
