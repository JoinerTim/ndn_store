import { Entity, Column, ManyToOne, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Employee } from "./Employee";
import { Permission } from "./Permission";
import { Store } from "./Store";

@Entity(addPrefix("store_permission"))
export class StorePermission extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    // RELATIONS
    @ManyToOne(() => Permission)
    permission: Permission;

    @ManyToOne(() => Employee)
    employee: Employee;

    @ManyToOne(() => Store)
    store: Store;

    // METHODS
    public async assignPermission(permissionId: number) {
        const permission = await Permission.findOneOrThrowId(permissionId, null, '')
        this.permission = permission
    }

    public async assignEmployee(employeeId: number) {
        const employee = await Employee.findOneOrThrowId(employeeId, null, '')
        this.employee = employee
    }


} // END FILE
