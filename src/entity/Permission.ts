import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Role } from "./Role";
import { BenefitPackage } from "./BenefitPackage";

@Entity(addPrefix("permission"))
export class Permission extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @Column()
    @Property()
    path: string;

    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: '' })
    @Property()
    title: string;

    // RELATIONS

    @ManyToMany(() => Role, role => role.permissions)
    @JoinTable()
    roles: Role[]

    @ManyToMany(() => BenefitPackage, benefitPackage => benefitPackage.permissions)
    benefitPackages: BenefitPackage[];

    // METHODS

} // END FILE
