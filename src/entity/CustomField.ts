import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { ProductCategory } from "./ProductCategory";
import { Product } from "./Product";
import { ProductCustomField } from "./ProductCustomField";
import { Store } from "./Store";
import { Employee } from "./Employee";

@Entity(addPrefix("custom_field"))
export class CustomField extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: '' })
    @Property()
    nameEn: string;//tiếng anh

    @Column({ default: '' })
    @Property()
    icon: string;

    @Column({ default: true })
    @Property()
    isVisible: boolean;

    // RELATIONS
    @OneToMany(() => ProductCustomField, productCustomField => productCustomField)
    productCustomFields: ProductCustomField[];

    @ManyToOne(() => Store, store => store)
    store: Store;

    @ManyToOne(() => Employee)
    deletedBy: Employee;

    // METHODS


} // END FILE
