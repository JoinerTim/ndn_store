// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { Configuration, ConfigurationParam } from "../entity/Configuration";
import { Customer } from "../entity/Customer";


// IMPORT CUSTOM
import { CustomerTransaction, CustomerTransactionType } from "../entity/CustomerTransaction";
import { Order } from "../entity/Order";
import { CustomerRankService } from "./CustomerRankService";
import { BadRequest } from "@tsed/exceptions";
import { RefCustomer, RefCustomerType } from "../entity/RefCustomer";
import { In } from "typeorm";
import { NotificationService } from "./NotificationService";

interface CustomerTransactionQuery {
    page: number;
    limit: number
    search?: string
    customerId?: number
    type?: CustomerTransactionType
    isCompleted?: boolean
}

@Service()
export class CustomerTransactionService {

    constructor(
        private customerRankService: CustomerRankService,
        private notificationService: NotificationService
    ) {

    }

    $onReady() {
    }

    async create({
        beforeChange,
        afterChange,
        customer,
        isCompleted,
        type,
        expireBlockedAt,
        change,
        order,
        registerCustomer
    }: Partial<CustomerTransaction>) {
        const customerTransaction = new CustomerTransaction()
        customerTransaction.beforeChange = beforeChange;
        customerTransaction.afterChange = afterChange;
        customerTransaction.customer = customer
        customerTransaction.type = type
        customerTransaction.isCompleted = isCompleted;
        customerTransaction.expireBlockedAt = expireBlockedAt;
        customerTransaction.change = change;
        customerTransaction.order = order;
        customerTransaction.registerCustomer = registerCustomer

        await customerTransaction.generateCode();
        await customerTransaction.save();
        return customerTransaction;
    }

    async getManyAndCount({
        page,
        limit,
        search = '',
        customerId,
        type,
        isCompleted
    }: CustomerTransactionQuery) {
        let where = `CONCAT(customerTransaction.code, customer.firstName, ' ', customer.lastName) LIKE :search AND customerTransaction.isDeleted = false`;

        if (customerId) {
            where += ` AND customer.id = :customerId`
        }

        if (type) {
            where += ' AND customerTransaction.type = :type'
        }

        if (typeof isCompleted == 'boolean') {
            where += ' AND customerTransaction.isCompleted = :isCompleted'
        }

        const [customerTransactions, total] = await CustomerTransaction.createQueryBuilder('customerTransaction')
            .leftJoinAndSelect('customerTransaction.customer', 'customer')
            .where(where, { search: `%${search}%`, type, customerId, isCompleted })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('customerTransaction.id', 'DESC')
            .getManyAndCount()

        return { customerTransactions, total }
    }


    /**
     * Xử lý khi khách hàng đánh giá đơn
     */
    async handleWhenRateOrder(orderId: number) {
        const order = await Order.findOneOrThrowId(orderId, {
            relations: ['customer']
        }, '')

        const { customer, rewardPoints } = order

        const point = rewardPoints

        if (!point) {
            return;
        }

        const beforeChange = customer.balance;
        const afterChange = customer.balance + point;

        const customerTransaction = await this.create({
            beforeChange,
            afterChange,
            customer,
            type: CustomerTransactionType.RateOrder,
            isCompleted: true,
            change: point,
            order
        });

        await Customer.createQueryBuilder()
            .update()
            .set({
                balance: () => `balance + ${point}`,
                totalBalance: () => `totalBalance + ${point}`,
            })
            .where('id = :id', { id: customer.id })
            .execute();

        this.customerRankService.upgradeRank(customer.id, point)
        return customerTransaction;
    }

    /**
     * cộng điểm khi hoàn thành đơn hàng
     */
    async handleWhenCompleteOrder(customer: Customer, order: Order) {
        if (order.isHasPoint) {
            const { totalPoints } = order;
            const balance = customer.balance

            const beforeChange = balance;
            const afterChange = balance + totalPoints;

            const customerTransaction = await this.create({
                beforeChange,
                afterChange,
                customer,
                type: CustomerTransactionType.CompleteOrder,
                isCompleted: true,
                change: totalPoints,
                order
            });

            await Customer.createQueryBuilder()
                .update()
                .set({
                    balance: () => `balance + ${totalPoints}`,
                    totalBalance: () => `totalBalance + ${totalPoints}`,
                })
                .where('id = :id', { id: customer.id })
                .execute();

            await this.customerRankService.upgradeRank(customer.id, totalPoints)
        }

        //cộng điểm hoa hồng cho người chia sẻ
        const refCustomers = await RefCustomer.createQueryBuilder('refCustomer')
            .leftJoinAndSelect('refCustomer.order', 'order')
            .leftJoinAndSelect('order.details', 'orderDetail')
            .leftJoinAndSelect('orderDetail.product', 'product')
            .leftJoinAndSelect('orderDetail.refCustomer', 'refCustomerDetail')
            .leftJoinAndSelect('refCustomer.customer', 'customer')
            .leftJoinAndSelect('customer.store', 'store')
            .where('order.id = :orderId AND refCustomerDetail.id = customer.id', { orderId: order.id })
            .getMany()

        if (refCustomers.length) {
            const refCustomersConfirmed = await Promise.all(refCustomers.map(async (item) => {

                await Customer.createQueryBuilder()
                    .update()
                    .set({
                        balance: () => `balance + ${item.totalPoint}`,
                        totalBalance: () => `totalBalance + ${item.totalPoint}`,
                    })
                    .where('id = :id', { id: item.customer.id })
                    .execute();

                const customerTransaction = await this.create({
                    beforeChange: item.customer.balance,
                    afterChange: item.customer.balance + item.totalPoint,
                    customer: item.customer,
                    type: CustomerTransactionType.CompleteOrder,
                    isCompleted: true,
                    change: item.totalPoint,
                    order
                });

                await this.customerRankService.upgradeRank(item.customer.id, item.totalPoint)
                item.isConfirmed = true
                await this.notificationService.handleWhenCompleteFromRefCustomer(customer, item.customer, item.customer.store, item.totalPoint, item.order?.details[0]?.product)

                return item
            }))

            await RefCustomer.save(refCustomersConfirmed)
        }

        await RefCustomer.update({ id: In(refCustomers.map((item) => item.id)) }, { isConfirmed: true })

    }

    /**
     * trừ điểm khi thanh toán đơn hàng
     */
    async handleWhenBuyOrder(customer: Customer, order: Order) {
        const { moneyFinal } = order;
        const balance = customer.balance

        const beforeChange = balance;
        const afterChange = balance - moneyFinal;

        const customerTransaction = await this.create({
            beforeChange,
            afterChange,
            customer,
            type: CustomerTransactionType.BuyOrder,
            isCompleted: true,
            change: -moneyFinal,
            order
        });

        await Customer.createQueryBuilder()
            .update()
            .set({
                balance: () => `balance - ${moneyFinal}`,
            })
            .where('id = :id', { id: customer.id })
            .execute();



        return customerTransaction
    }

    /**
    * cộng điểm khi hủy đơn hàng
    */
    async handleWhenCancelOrder(customer: Customer, order: Order) {
        const { moneyFinal } = order;
        const balance = customer.balance

        const beforeChange = balance;
        const afterChange = balance + moneyFinal;

        const customerTransaction = await this.create({
            beforeChange,
            afterChange,
            customer,
            type: CustomerTransactionType.RefundOrder,
            isCompleted: true,
            change: moneyFinal,
            order
        });

        await Customer.createQueryBuilder()
            .update()
            .set({
                balance: () => `balance + ${moneyFinal}`,
            })
            .where('id = :id', { id: customer.id })
            .execute();

        return customerTransaction
    }


    async handleWhenCompleteRegister(newCustomer: Customer, refCustomerId: number) {
        if (refCustomerId) {
            const customerShared = await Customer.createQueryBuilder('customer')
                .leftJoinAndSelect('customer.store', 'store')
                .where('customer.id = :refCustomerId AND store.id = :storeId', { refCustomerId, storeId: newCustomer.store.id })
                .getOne()

            const configurationRefPoint = await Configuration.createQueryBuilder('configuration')
                .leftJoinAndSelect('configuration.store', 'store')
                .where(`configuration.isDeleted = false AND store.id = :storeId AND configuration.param = "${ConfigurationParam.RefRegisterPoint}"`, { storeId: newCustomer.store.id })
                .getOne()

            const totalPointForRef = Number(configurationRefPoint?.value) || 0

            if (customerShared) {
                const balance = customerShared.balance

                const beforeChange = balance;
                const afterChange = balance + totalPointForRef;

                const customerTransaction = await this.create({
                    beforeChange,
                    afterChange,
                    customer: customerShared,
                    type: CustomerTransactionType.RefRegister,
                    isCompleted: true,
                    change: totalPointForRef,
                    registerCustomer: newCustomer
                });

                customerShared.balance += totalPointForRef
                customerShared.totalBalance += totalPointForRef
                await customerShared.save()


                const refCustomer = new RefCustomer()
                refCustomer.type = RefCustomerType.Register
                refCustomer.totalPoint = totalPointForRef
                refCustomer.isConfirmed = true
                refCustomer.registerCustomer = newCustomer
                await refCustomer.assignCustomer(refCustomerId)
                await refCustomer.save()

                await this.customerRankService.upgradeRank(refCustomerId, totalPointForRef)

                // await this.notificationService.handleWhenCompleteRegisterFromRefCustomer(newCustomer, customerShared, newCustomer.store, totalPointForRef)
            }
        }
    }

} //END FILE
