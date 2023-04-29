import { Entity, Column, ManyToOne } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Staff } from "./Staff";
import { Store } from "./Store";
import { Employee } from "./Employee";

/**
 * các thiết bị đã login
 */
@Entity(addPrefix("session_device"))
export class SessionDevice extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    deviceName: string;

    @Column({ default: '' })
    deviceId: string;

    @Column({ default: '' })
    ipAddress: string;

    // RELATIONS
    @ManyToOne(() => Staff)
    staff: Staff;

    @ManyToOne(() => Store)
    store: Store;

    @ManyToOne(() => Employee)
    employee: Employee;

    // METHODS


} // END FILE
