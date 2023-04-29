import { Entity, Column, ManyToOne, OneToOne } from "typeorm";

import { addPrefix, getCurrentDateYYMMDD, leftPad } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Customer } from "./Customer";
import { Deposit } from "./Deposit";
import moment from "moment";
import { CUSTOMER_TRANSACTION_CODE } from "../constant";
import { Order } from "./Order";

export enum CustomerTransactionType {
    BuyOrder = 'BUY_ORDER', //thanh toán đơn hàng
    Transfer = 'TRANSFER', //chuyển khoản từ tk C
    RefundOrder = 'REFUND_ORDER', //Hoàn đơn hủy (Staff thao tác)
    CompleteOrder = 'COMPLETE_ORDER', //nhận điểm khi đơn hàng hoàn tất
    RateOrder = 'RATE_ORDER',//đánh giá đơn nhận điểm
    RefOrder = 'REF_ORDER',//nhận điểm khi mời bạn bè mua hàng
    RefRegister = 'REF_REGISTER',//nhận điểm khi mời bạn bè đăng kí
}

@Entity(addPrefix("customer_transaction"))
export class CustomerTransaction extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    code: string;

    @Column({ default: 0, type: 'double' })
    beforeChange: number;

    @Column({ default: 0, type: 'double' })
    change: number;

    @Column({ default: 0, type: 'double' })
    afterChange: number;

    @Column({ default: true })
    isCompleted: boolean;

    @Column({ nullable: true })
    expireBlockedAt: number;

    @Column({ nullable: true, enum: CustomerTransactionType, type: 'enum' })
    type: CustomerTransactionType;

    // RELATIONS
    @ManyToOne(() => Customer, customer => customer.customerTransactions)
    customer: Customer;

    @ManyToOne(() => Customer, customer => customer.registerCustomerTransactions)
    registerCustomer: Customer;

    @OneToOne(() => Deposit, deposit => deposit.customerTransaction)
    deposit: Deposit;

    @ManyToOne(() => Order)
    order: Order;

    // METHODS
    async generateCode() {
        const start = moment().startOf('day').unix()
        const end = moment().endOf('day').unix()

        const count = await CustomerTransaction.createQueryBuilder('customerTransaction')
            .where(`customerTransaction.createdAt BETWEEN ${start} AND ${end}`)
            .getCount()

        this.code = `${CUSTOMER_TRANSACTION_CODE}${getCurrentDateYYMMDD()}/${leftPad(count + 1, 4)}`
    }


} // END FILE
