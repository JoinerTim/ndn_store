import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";


import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";

@Entity(addPrefix("social_network"))
export class SocialNetwork extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: 0 })
    @Property()
    pos: number; //vị trí

    @Column({ default: '' })
    @Property()
    imageUrl: string;

    @Column({ default: '' })
    @Property()
    url: string; //link dan den social

    @Column({ default: true })
    @Property()
    isVisible: boolean;

    // RELATIONS


    // METHODS


} // END FILE
