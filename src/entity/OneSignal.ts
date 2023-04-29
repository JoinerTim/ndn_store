import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { Customer } from "./Customer";
import { Staff } from "./Staff";
import { Employee } from "./Employee";

@Entity(addPrefix("one_signal"))
export class OneSignal extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    oneSignalId: string;


    // RELATIONS
    @ManyToOne(() => Customer, customer => customer.oneSignals)
    customer: Customer;

    @ManyToOne(() => Staff, staff => staff.oneSignals)
    staff: Staff;

    @ManyToOne(() => Employee, employee => employee.oneSignals)
    employee: Employee;

    // METHODS


} // END FILE
