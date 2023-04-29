import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Product } from "./Product";
import { CustomField } from "./CustomField";

@Entity(addPrefix("product_custom_field"))
export class ProductCustomField extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    value: string;

    @Column({ default: '' })
    @Property()
    valueEn: string;


    // RELATIONS
    @ManyToOne(() => Product, product => product.productCustomFields)
    product: Product;

    @ManyToOne(() => CustomField, customField => customField.productCustomFields)
    customField: CustomField;


    // METHODS
    public async assignCustomField(customFieldId: number) {
        const customField = await CustomField.findOneOrThrowId(customFieldId, null, '')
        this.customField = customField
    }


} // END FILE
