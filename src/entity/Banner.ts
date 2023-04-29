import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Product } from "./Product";
import { News } from "./News";
import { Store } from "./Store";


export enum BannerContentType {
    Content = 'CONTENT',
    Link = 'LINK',
    News = 'NEWS',
}

@Entity(addPrefix("banner"))
export class Banner extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    @Property()
    title: string;

    @Column({ default: '' })
    @Property()
    link: string;

    @Column({ nullable: true, type: 'text' })
    @Property()
    content: string;

    @Column({ default: BannerContentType.Content })
    @Property()
    contentType: BannerContentType;

    @Column({ default: '' })
    @Property()
    image: string;

    @Column({ default: '' })
    @Property()
    desktopImage: string;

    @Column({ default: 0 })
    @Property()
    pos: number; //position: 1 đứng đầu ASC

    @Column({ default: true })
    @Property()
    isVisible: boolean;

    @Column({ default: true })
    @Property()
    isVisibleDetail: boolean; //true hiển thị ở trang chi tiết các business type

    // RELATIONS

    @ManyToOne(() => News, news => news.banners)
    news: News;

    @ManyToOne(() => Store, store => store.banners)
    store: Store;

    // METHODS

    public async assignNews(newsId: number) {
        const news = await News.findOneOrThrowId(newsId, null, '')
        this.news = news
    }

} // END FILE
