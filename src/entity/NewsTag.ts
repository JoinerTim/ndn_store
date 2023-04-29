import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany } from "typeorm";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { News } from "./News";
import { Store } from "./Store";

/**
 * thẻ của các bài viết về tin tức
 */
@Entity(addPrefix("news_tag"))
export class NewsTag extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    name: string;


    // RELATIONS
    @ManyToMany(() => News, news => news.newsTags)
    newses: News[];

    @ManyToOne(() => Store, store => store.newsTags)
    store: Store;
    // METHODS


} // END FILE
