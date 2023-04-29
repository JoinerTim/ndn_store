import { Entity, Column, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Role } from "./Role";
import { Permission } from "./Permission";
import { Store } from "./Store";
import { BenefitPackageOrder } from "./BenefitPackageOrder";

@Entity(addPrefix("benefit_package"))
export class BenefitPackage extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: '' })
    @Property()
    description: string;

    @Column({ default: 0 })
    @Property()
    expiry: number; // hạn sử dụng (năm)

    @Column({ default: 0, type: 'double' })
    @Property()
    price: number;

    @Column({ default: false })
    isDefault: boolean;


    // RELATIONS
    @ManyToMany(() => Permission, permission => permission.benefitPackages)
    @JoinTable()
    permissions: Permission[];

    @OneToMany(() => Store, store => store.benefitPackage)
    stores: Store[];

    @OneToMany(() => BenefitPackageOrder, benefitPackageDetail => benefitPackageDetail.benefitPackage)
    benefitPackageOrders: BenefitPackageOrder[];

    // METHODS


} // END FILE
