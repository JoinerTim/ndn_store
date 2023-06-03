// IMPORT LIBRARY
import { Entity, Column, OneToMany, ManyToMany, JoinTable, ManyToOne, OneToOne, Index, BeforeInsert, BeforeUpdate } from "typeorm";
import { Property } from "@tsed/schema";

// IMPORT CUSTOM
import { addPrefix, leftPad, randomCode } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Gender } from "../enum";
import { Notification } from "./Notification";
import { News } from "./News";
import moment from "moment";
import { CustomerTransaction } from "./CustomerTransaction";
import { Deposit } from "./Deposit";
import { City } from "./City";
import { District } from "./District";
import { Ward } from "./Ward";
import { OneSignal } from "./OneSignal";
import { DeliveryAddress } from "./DeliveryAddress";
import { CustomerRank } from "./CustomerRank";
import { LikedProduct } from "./LikedProduct";
import { ViewedProduct } from "./ViewedProduct";
import { CustomerCoupon } from "./CustomerCoupon";
import { ConversationMessage } from "./ConversationMessage";
import { Conversation } from "./Conversation";
import { Order } from "./Order";
import { ConversationParticipant } from "./ConversationParticipant";
import { Store } from "./Store";
import { Otp } from "./OTP";
import { escape } from "mysql2";
import { OrderStatus } from "../types/order";
import { GroupCustomer } from "./GroupCustomer";

@Entity(addPrefix("customer"))
export class Customer extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES

    @Column({ default: '' })
    code: string

    @Column({ default: '' })
    @Property()
    email: string;

    @Column({ default: 0, type: 'double' })
    balance: number; // points

    @Column({ default: 0, type: 'double' })
    totalBalance: number;

    @Column({ default: '' })
    @Property()
    firstName: string;

    @Column({ default: '' })
    @Property()
    lastName: string;

    @Column({ default: '' })
    @Index({ fulltext: true })
    fullName: string;

    @Column({ default: '' })
    @Property()
    avatar: string;

    @Column({ default: '' })
    @Property()
    bio: string;

    @Column({ default: true })
    isAllowChangeDob: boolean; //false: đã nhận coupon quà sinh nhật -> k đc đổi ngày sinh

    @Column({ default: '' })
    fcmToken: string;

    @Column({ default: 0 })
    fcmTokenExpired: number;

    @Column({ default: '' })
    @Property()
    dob: string;//format: Y-m-d

    @Column({ default: false })
    isVerified: boolean; //true: đã verify với e-kyc

    @Column({ default: Gender.Male, type: 'enum', enum: Gender })
    @Property()
    gender: Gender;

    @Column({ default: '' })
    @Property()
    address: string; //

    @Column({ default: '' })
    @Property()
    phone: string;

    @Column({ default: 0 })
    notificationBadgeCount: number; //Sl thông báo

    @Column({ select: false, default: '' })
    password: string

    @Column({ default: false })
    isBlocked: boolean

    @Column({ default: '' })
    facebookId: string

    @Column({ default: '' })
    googleId: string

    @Column({ default: '' })
    appleId: string

    @Column({ default: '' })
    zaloId: string;

    @Column({ default: '', select: false })
    resetCode: string

    @Column({ default: 0 })
    cycleBuy: number;//chu kỳ mua hàng, tính bằng ngày

    @Column({ default: 0 })
    lastOrderAt: number; //ngày mua cuối cùng

    @Column({ default: 0 })
    numOfOrders: number; //sl đơn đã mua, k tính đơn hủy

    //customer
    totalCancelOrders: number //sl đơn hủy
    totalOrders: number //Tổng sl đơn hàng
    stockUpRate: number // tỷ lệ bùng hàng

    // RELATIONS
    @OneToMany(() => Notification, notification => notification.customer)
    notifications: Notification[];

    @ManyToMany(() => Notification, notification => notification.viewedCustomers)
    viewedNotifications: Notification[]; //notifications da xem

    @ManyToMany(() => News, news => news.likedCustomers)
    @JoinTable()
    likedNews: News[];

    @ManyToMany(() => Notification, notification => notification.assignedCustomers)
    assignedNotifications: Notification[];

    @OneToMany(() => CustomerTransaction, customerTransaction => customerTransaction.customer)
    customerTransactions: CustomerTransaction[];

    @OneToMany(() => CustomerTransaction, customerTransaction => customerTransaction.registerCustomer)
    registerCustomerTransactions: CustomerTransaction[];

    @OneToMany(() => Deposit, deposit => deposit.customer)
    deposits: Deposit[];

    @ManyToOne(() => City)
    city: City;

    @ManyToOne(() => District)
    district: District;

    @ManyToOne(() => Ward)
    ward: Ward;

    @ManyToOne(() => Customer)
    refCustomer: Customer;

    @OneToMany(() => OneSignal, oneSignal => oneSignal.customer)
    oneSignals: OneSignal[];

    @ManyToOne(() => CustomerRank, customerRank => customerRank.customers)
    customerRank: CustomerRank;

    @OneToMany(() => DeliveryAddress, deliveryAddress => deliveryAddress.customer)
    deliveryAddresses: DeliveryAddress[];

    @OneToMany(() => LikedProduct, likedProduct => likedProduct.customer)
    likedProducts: LikedProduct[];

    @OneToMany(() => ViewedProduct, viewedProduct => viewedProduct.customer)
    viewedProducts: ViewedProduct[];

    @OneToMany(() => CustomerCoupon, customerCoupon => customerCoupon.customer)
    customerCoupons: CustomerCoupon[];

    @ManyToMany(() => ConversationMessage, conversationMessage => conversationMessage.seenCustomers)
    seenConversationMessages: ConversationMessage[];

    @OneToMany(() => Conversation, conversation => conversation.owner)
    ownerConversations: Conversation[];

    @OneToMany(() => Order, order => order.customer)
    orders: Order[];

    @OneToMany(() => ConversationParticipant, conversationParticipant => conversationParticipant.customer)
    conversationParticipants: ConversationParticipant[];

    @OneToMany(() => Otp, otp => otp.customer)
    otp: Otp[];

    @ManyToOne(() => Store, store => store.customers)
    store: Store;

    @ManyToMany(() => GroupCustomer, groupCustomer => groupCustomer.customers)
    groupCustomers: GroupCustomer[];

    // METHODS
    // @BeforeInsert()
    // @BeforeUpdate()
    // handleUpdateFullName() {
    //     this.fullName = this.lastName + ' ' + this.firstName
    // }

    /**
     * Tính chu kỳ mua
     */
    async calcBuyCycle() {
        const statuses = [OrderStatus.Cancel, OrderStatus.ReturnRefund]
        let where = `order.isDeleted = 0 AND order.status NOT IN (:...statuses) AND order.customerId = :customerId`

        const customerId = this.id
        const orders = await Order.createQueryBuilder('order')
            .where(where, { customerId, statuses })
            .orderBy('order.createdAt', 'ASC')
            .getMany()


        let cycleBuy = 0, lastOrderAt = 0
        if (orders.length >= 2) {
            const dates = orders.map(e => e.createdAt)
            let totalDay = 0
            for (let i = 1; i < dates.length; i++) {
                // const prevDate = moment(dates[i - 1]);
                // const currentDate = moment(dates[i])
                // totalDay += currentDate.diff(prevDate, 'days');
                totalDay += Math.ceil((dates[i] - dates[i - 1]) / 3600)
            }

            cycleBuy = Math.ceil(totalDay / (dates.length - 1))
        }

        if (orders.length) {
            lastOrderAt = orders.pop().createdAt
        }

        console.log('calcBuyCycle customerId', this.id, 'cycleBuy', cycleBuy, 'lastOrderAt', lastOrderAt, 'orders:', orders.length);


        await Customer.createQueryBuilder()
            .update()
            .set({
                cycleBuy,
                lastOrderAt,
                numOfOrders: orders.length
            })
            .where('id = :id', { id: this.id })
            .execute()
    }

    async generateCode() {
        const startDay = moment().startOf('day').unix()
        const endDay = moment().endOf('day').unix()

        const count = await Customer.createQueryBuilder('customer')
            .where(`customer.createdAt BETWEEN ${startDay} AND ${endDay}`)
            .getCount()

        const day = moment().format('YYYYMMDD')

        this.code = `${day}${leftPad(count + 1, 4)}`
    }

    async getOneSignalIds() {
        const oneSignals = await OneSignal.createQueryBuilder('oneSignal')
            .where('oneSignal.customerId = :id', { id: this.id })
            .getMany();

        return oneSignals.map(e => e.oneSignalId)
    }

    generateResetCode() {
        this.resetCode = randomCode(5);
    }

    public async assignCity(cityId: number) {
        const city = await City.findOneOrThrowId(cityId, null, '')
        this.city = city
    }

    public async assignDistrict(districtId: number) {
        const district = await District.findOneOrThrowId(districtId, null, '')
        this.district = district
    }

    public async assignWard(wardId: number) {
        const ward = await Ward.findOneOrThrowId(wardId, null, '')
        this.ward = ward
    }

    public async assignRefCustomer(customerId: number) {
        const customer = await Customer.findOneOrThrowId(customerId, null, 'Người giới thiệu')
        this.refCustomer = customer
    }
} // END FILE
