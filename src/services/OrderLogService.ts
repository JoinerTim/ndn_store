// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { OrderLog } from "../entity/OrderLog";

interface OrderLogQuery {
    page: number;
    limit: number
    search?: string
    orderId?: number
}

@Service()
export class OrderLogService {

    async create({
        type,
        status,
        order,
        staff,
        customer,
        createFrom
    }: Partial<OrderLog>) {
        const orderLog = new OrderLog()
        orderLog.type = type;
        orderLog.status = status;
        orderLog.order = order;
        orderLog.staff = staff;
        orderLog.customer = customer;
        orderLog.createFrom = createFrom;

        await orderLog.save()
        return orderLog
    }

    async getManyAndCount({
        page,
        limit,
        search = '',
        orderId
    }: OrderLogQuery) {
        let where = `orderLog.isDeleted = false`

        if (orderId) {
            where += ` AND order.id = :orderId`
        }

        const [orderLogs, total] = await OrderLog.createQueryBuilder('orderLog')
            .leftJoinAndSelect('orderLog.order', 'order')
            .where(where, { search: `%${search}%`, orderId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('orderLog.id', 'DESC')
            .getManyAndCount()

        return { orderLogs, total }
    }

} //END FILE
