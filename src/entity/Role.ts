import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany, OneToOne, JoinColumn, JoinTable } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Permission } from "./Permission";
import { Staff } from "./Staff";
import { Store } from "./Store";
import { Employee } from "./Employee";

@Entity(addPrefix("role"))
export class Role extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ nullable: true, type: 'text' })
    @Property()
    description: string

    @Column({ default: false })
    @Property()
    isAdmin: boolean;


    // RELATIONS

    @OneToMany(() => Staff, admin => admin.role)
    staff: Staff[]

    @ManyToMany(() => Permission, permission => permission.roles)
    permissions: Permission[]

    @ManyToOne(() => Store, store => store.roles)
    store: Store;

    @OneToMany(() => Employee, employee => employee.role)
    employees: Employee[];

    // METHODS

} // END FILE
