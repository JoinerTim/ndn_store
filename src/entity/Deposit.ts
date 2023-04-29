import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany, JoinColumn, OneToOne } from "typeorm";

import { addPrefix, leftPad } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { Customer } from "./Customer";
import { Staff } from "./Staff";
import { CustomerTransaction } from "./CustomerTransaction";
import { DEPOSIT_CODE } from "../constant";

export enum DepositStatus {
    Pending = 'PENDING',
    Complete = 'COMPLETE',
    Fail = 'FAIL'
}


@Entity(addPrefix("deposit"))
export class Deposit extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    code: string;

    @Column({ default: DepositStatus.Pending, type: 'enum', enum: DepositStatus })
    status: DepositStatus;

    @Column({ default: 0, type: 'double' })
    @Property()
    amount: number;

    @Column({ default: '' })
    @Property()
    note: string;

    @Column({ nullable: true })
    expireBlockedAt: number;

    // RELATIONS
    @ManyToOne(() => Customer, customer => customer.deposits)
    customer: Customer;

    @ManyToOne(() => Staff)
    staff: Staff;

    @OneToOne(() => CustomerTransaction, customerTransaction => customerTransaction.deposit)
    @JoinColumn()
    customerTransaction: CustomerTransaction;
    // METHODS
    async generateCode() {
        const count = await Deposit.count()
        this.code = `${DEPOSIT_CODE}${leftPad(count + 1, 4)}`
    }


} // END FILE
