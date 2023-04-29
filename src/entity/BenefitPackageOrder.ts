import { Entity, Column, ManyToOne } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { BenefitPackage } from "./BenefitPackage";
import { Store } from "./Store";
import moment from "moment-timezone";


@Entity(addPrefix("benefit_package_order"))
export class BenefitPackageOrder extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: 0, type: 'double' })
    @Property()
    price: number;

    @Column({ default: 0 })
    expiredAt: number; // ngày hết hạn

    @Column({ default: 0 })
    expiry: number; // hạn sử dụng (năm)

    // RELATIONS
    @ManyToOne(() => BenefitPackage, benefitPackage => benefitPackage.benefitPackageOrders)
    benefitPackage: BenefitPackage;


    @ManyToOne(() => Store, store => store)
    store: Store;

    // METHODS
    public async assignBenefitPackage(benefitPackageId: number) {
        if (!benefitPackageId) {
            const benefitPackage = await BenefitPackage.findOneOrThrowOption({ where: { isDefault: true } })
            this.benefitPackage = benefitPackage
            this.price = benefitPackage.price
            this.expiry = benefitPackage.expiry
            this.expiredAt = moment().add(this.expiry, 'years').endOf('day').unix();
        }
        else {
            const benefitPackage = await BenefitPackage.findOneOrThrowId(benefitPackageId, null, '')
            this.benefitPackage = benefitPackage
            this.price = benefitPackage.price
        }
    }

    public async assignStore(storeId: number) {
        const store = await Store.findOneOrThrowId(storeId, null, '')
        this.store = store
    }

} // END FILE
