// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { OnlinePayment } from "../entity/OnlinePayment";

interface OnlinePaymentQuery {
    page: number;
    limit: number
    search?: string
    storeId: number
}

@Service()
export class OnlinePaymentService {

    async getManyAndCount({
        page,
        limit,
        search = '',
        storeId
    }: OnlinePaymentQuery) {
        let where = `onlinePayment.name LIKE :search AND onlinePayment.isDeleted = false`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const [onlinePayments, total] = await OnlinePayment.createQueryBuilder('onlinePayment')
            .leftJoinAndSelect('onlinePayment.store', 'store')
            .where(where, { search: `%${search}%`, storeId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('onlinePayment.id', 'DESC')
            .getManyAndCount()

        return { onlinePayments, total }
    }

} //END FILE
