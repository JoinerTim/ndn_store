// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { GroupCustomer } from "../entity/GroupCustomer";
import { Store } from "../entity/Store";
import { BadRequest } from "@tsed/exceptions";
import { Customer } from "../entity/Customer";

interface GroupCustomerQuery {
    page: number;
    limit: number
    search?: string
    store: Store
}

interface GroupCustomerCreateParams {
    groupCustomer: GroupCustomer
    store: Store
    customerIds?: Number[]
    groupCustomerId?: number
}

@Service()
export class GroupCustomerService {

    async getOne(groupCustomerId: number, store: Store) {
        const groupCustomer = await GroupCustomer.findOneOrThrowOption({
            where: { id: groupCustomerId, store: store },
            relations: ["customers", "store"]
        })
        return groupCustomer
    }

    async getManyAndCount({
        page,
        limit,
        search = '',
        store
    }: GroupCustomerQuery) {
        let where = `groupCustomer.name LIKE :search AND groupCustomer.isDeleted = false AND store.id = :storeId`;

        const [groupCustomers, total] = await GroupCustomer.createQueryBuilder('groupCustomer')
            .leftJoinAndSelect('groupCustomer.customers', 'customers')
            .leftJoinAndSelect('customers.customerRank', 'customerRank')
            .leftJoinAndSelect('customers.city', 'city')
            .leftJoinAndSelect('customers.district', 'district')
            .leftJoinAndSelect('customers.ward', 'ward')
            .leftJoinAndSelect('customers.refCustomer', 'refCustomer')
            .leftJoinAndSelect('groupCustomer.store', 'store')
            .where(where, { search: `%${search}%`, storeId: store.id })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('groupCustomer.id', 'DESC')
            .getManyAndCount()

        return { groupCustomers, total }
    }


    async createOrUpdate({ groupCustomer, store, customerIds, groupCustomerId }: GroupCustomerCreateParams): Promise<GroupCustomer> {
        if (groupCustomerId) {
            const oldGroupCustomer = await GroupCustomer.createQueryBuilder('groupCustomer')
                .leftJoinAndSelect('groupCustomer.store', 'store')
                .leftJoinAndSelect('groupCustomer.customers', 'customers')
                .leftJoinAndSelect('groupCustomer.notifications', 'notifications')
                .where('groupCustomer.isDeleted = false AND groupCustomer.id = :groupCustomerId AND store.id = :storeId', { groupCustomerId, storeId: store.id })
                .getOne()

            if (!oldGroupCustomer) {
                throw new BadRequest("Nhóm người dùng không tồn tại.")
            }

            groupCustomer.id = groupCustomerId
        }

        groupCustomer.store = store
        if (customerIds.length) {

            const customers = await Customer.createQueryBuilder('customer')
                .leftJoinAndSelect('customer.store', 'store')
                .where('customer.id IN (:...customerIds) AND customer.isDeleted = false AND customer.isBlocked = false AND store.id = :storeId', { customerIds, storeId: store.id })
                .getMany()
            groupCustomer.customers = customers || []
        } else {
            groupCustomer.customers = []
        }

        await groupCustomer.save()

        return groupCustomer
    }

} //END FILE
