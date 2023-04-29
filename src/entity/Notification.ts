import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany, JoinTable, BeforeUpdate, BeforeInsert } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix, getCurrentTimeInt } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Customer } from "./Customer";
import { Order } from "./Order";
import { News } from "./News";
import { Staff } from "./Staff";
import { Product } from "./Product";
import { Deposit } from "./Deposit";
import { CustomerTransaction } from "./CustomerTransaction";
import { Store } from "./Store";
import { Employee } from "./Employee";
import { GroupCustomer } from "./GroupCustomer";
import { CouponCampaign } from "./CouponCampaign";
import { PromotionCampaign } from "./PromotionCampaign";

export enum NotificationType {
    Order = 'ORDER',
    News = 'NEWS',
    Coupon = 'COUPON',
    Promotion = 'PROMOTION',
    Product = 'PRODUCT',
    Normal = 'NORMAL',//Chúc mừng và thông báo cần truyền đạt thủ công khác
}

export enum NotificationMode {
    Global = 'GLOBAL', //Tất cả user
    Private = 'PRIVATE', // riêng cá nhân
    Group = 'GROUP'
}

export enum NotificationFrom {
    Admin = 'ADMIN',
    Store = 'STORE',
    Customer = 'CUSTOMER'
}

@Entity(addPrefix("notification"))
export class Notification extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '', collation: 'utf8mb4_unicode_ci' })
    @Property()
    title: string;

    @Column({ nullable: true, type: 'text', collation: 'utf8mb4_unicode_ci' })
    @Property()
    shortContent: string;

    @Column({ nullable: true, type: 'text', collation: 'utf8mb4_unicode_ci' })
    @Property()
    content: string;

    @Column({ default: false })
    isBirthday: boolean;

    @Column({ default: NotificationType.Normal, type: 'enum', enum: NotificationType })
    @Property()
    type: NotificationType;

    @Column({ default: NotificationFrom.Store, type: 'enum', enum: NotificationFrom })
    from: NotificationFrom;

    @Column({ default: NotificationMode.Global })
    mode: NotificationMode;

    @Column({ nullable: true })
    @Property()
    lastSentAt: number;

    @Column({ default: 0 })
    @Property()
    sendCount: number; //số lần gửi

    isRead: boolean;

    // RELATIONS
    @ManyToOne(() => Customer)
    customer: Customer;

    @ManyToOne(() => Employee)
    employee: Employee;

    @ManyToMany(() => Customer, customer => customer.assignedNotifications)
    @JoinTable()
    assignedCustomers: Customer[];

    @ManyToMany(() => Employee, employee => employee.assignedNotifications)
    @JoinTable()
    assignedEmployees: Employee[];

    @ManyToMany(() => Customer, customer => customer.viewedNotifications)
    @JoinTable()
    viewedCustomers: Customer[]; //Users da xem tin

    @ManyToMany(() => Employee, employee => employee.viewedNotifications)
    @JoinTable()
    viewedEmployees: Employee[]; //Employee da xem tin

    @ManyToOne(() => Order)
    order: Order;

    @ManyToOne(() => News)
    news: News;

    @ManyToOne(() => Staff)
    staffSent: Staff;

    @ManyToOne(() => Product, product => product)
    product: Product;

    @ManyToOne(() => CouponCampaign)
    couponCampaign: CouponCampaign;

    @ManyToOne(() => PromotionCampaign)
    promotionCampaign: PromotionCampaign;

    @ManyToOne(() => Deposit)
    deposit: Deposit;

    @ManyToOne(() => CustomerTransaction)
    customerTransaction: CustomerTransaction;

    @ManyToOne(() => Store)
    store: Store;

    @ManyToOne(() => GroupCustomer, groupCustomer => groupCustomer.notifications)
    groupCustomer: GroupCustomer;

    // METHODS
    @BeforeUpdate()
    @BeforeInsert()
    handleSentAt() {
        if (this.mode == NotificationMode.Private && !this.lastSentAt) {
            this.lastSentAt = getCurrentTimeInt();
        }
    }

    public async assignProduct(productId: number) {
        const product = await Product.findOneOrThrowId(productId, null, '')
        this.product = product
    }

    public async assignNews(newsId: number) {
        const news = await News.findOneOrThrowId(newsId, null, '')
        this.news = news
    }

    public async assignOrder(orderId: number) {
        const order = await Order.findOneOrThrowId(orderId, null, '')
        this.order = order
    }

    public async assignGroupCustomer(groupCustomerId: number, store: Store) {
        const groupCustomer = await GroupCustomer.findOneOrThrowOption({ where: { id: groupCustomerId, store } })
        this.groupCustomer = groupCustomer
    }

    public async assignCouponCampaign(couponCampaignId: number) {
        const couponCampaign = await CouponCampaign.findOneOrThrowId(couponCampaignId, null, '')
        this.couponCampaign = couponCampaign
    }

    public async assignPromotionCampaign(promotionCampaignId: number) {
        const promotionCampaign = await PromotionCampaign.findOneOrThrowId(promotionCampaignId, null, '')
        this.promotionCampaign = promotionCampaign
    }

} // END FILE
