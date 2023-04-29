import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Customer } from "./Customer";
import { ProductCategory } from "./ProductCategory";
import { NewsTag } from "./NewsTag";
import { Banner } from "./Banner";
import { Store } from "./Store";



@Entity(addPrefix("news"))
export class News extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '', collation: 'utf8mb4_unicode_ci' })
    @Property()
    title: string;

    @Column({ default: 0 })
    @Property()
    position: number;

    @Column({ default: '' })
    @Property()
    shortContent: string;

    @Column({ nullable: true, type: 'text', collation: 'utf8mb4_unicode_ci' })
    @Property()
    content: string;

    @Column({ default: false })
    @Property()
    isHighlight: boolean;

    @Column({})
    @Property()
    thumbnail: string;

    @Column({ default: 0 })
    @Property()
    totalViews: number; //số lượt view

    @Column({ default: true })
    @Property()
    isVisible: boolean;

    @Column({ default: 0 })
    @Property()
    likes: number;

    // RELATIONS
    @ManyToMany(() => Customer, customer => customer.likedNews)
    likedCustomers: Customer[];

    @ManyToMany(() => NewsTag, newsTag => newsTag.newses)
    @JoinTable()
    newsTags: NewsTag[];

    @OneToMany(() => Banner, banner => banner.news)
    banners: Banner[];

    @ManyToOne(() => Store)
    store: Store;

    // METHODS

    public async assignNewsTags(newsTagIds: number[]) {
        const newsTags = await NewsTag.findByIds(newsTagIds);
        this.newsTags = newsTags
    }


} // END FILE
