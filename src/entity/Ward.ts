import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";

@Entity(addPrefix("ward"))
export class Ward extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: 0 })
    @Property()
    priority: number

    @Column({ default: '' })
    @Property()
    parentCode: string

    @Column({ default: '' })
    @Property()
    code: string

    @Column({ default: '' })
    @Property()
    pathWithType: string

    @Column({ default: '' })
    @Property()
    path: string

    @Column({ default: '' })
    @Property()
    nameWithType: string

    @Column({ default: '' })
    @Property()
    type: string;

    @Column({ default: '' })
    @Property()
    slug: string;

    @Column({ default: '' })
    @Property()
    name: string;


    // RELATIONS


    // METHODS


} // END FILE
