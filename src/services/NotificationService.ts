// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";
import { CronJob } from "cron";
import moment from "moment";
import { escape } from "mysql2";
import { Customer } from "../entity/Customer";


// IMPORT CUSTOM
import { Notification, NotificationFrom, NotificationMode, NotificationType } from "../entity/Notification";
import { Order } from "../entity/Order";
import { Staff } from "../entity/Staff";
import { Store } from "../entity/Store";
import { OrderStatus } from "../types/order";
import { QueryObject } from "../types/query";
import { Firebase } from "../util/firebase";
import { OneSignalUtil } from "../util/oneSignal";
import { OneSignalService } from "./OneSignalService";
import { CouponCampaign } from "../entity/CouponCampaign";
import { Employee } from "../entity/Employee";
import { SelectQueryBuilder } from "typeorm";
import { OneSignal } from "../entity/OneSignal";
import { GroupCustomer } from "../entity/GroupCustomer";
import { Product } from "../entity/Product";

interface NotificationQuery {
    page: number;
    limit: number
    search?: string;
    customerId?: number;
    employeeId?: number;
    mode?: NotificationMode;
    visibleLastSent?: boolean
    type?: NotificationType
    queryObject?: string
    storeId?: number;
    sortBy?: 'notification.id' | 'notification.lastSentAt',
    from?: NotificationFrom,
    isAdmin?: boolean
}

interface NotificationCreateParams {
    notification: Notification,
    orderId?: number,
    newsId?: number,
    productId?: number,
    notificationId?: number,
    store?: Store,
    from?: NotificationFrom,
    groupCustomerId?: number,
    couponCampaignId?: number,
    promotionCampaignId?: number

}


@Service()
export class NotificationService {

    constructor(
        private oneSignalService: OneSignalService
    ) {

    }

    $onReady() {
        //set lúc 11h00
        new CronJob('0 11 * * *', () => {
            this.sendBirthdayNotification()
        }).start()
    }

    /**
     * Gửi thông báo cho khách có sinh nhật, ngày kỷ niệm
     */
    async sendBirthdayNotification() {

    }

    async create({
        order,
        title,
        content,
        customer,
        type,
        mode,
        shortContent,
        deposit,
        customerTransaction,
        store
    }: Partial<Notification>) {
        const notification = new Notification();
        notification.title = title;
        notification.content = content;
        notification.shortContent = shortContent;
        notification.order = order;
        notification.customer = customer;
        notification.type = type;
        notification.mode = mode;
        notification.deposit = deposit;
        notification.customerTransaction = customerTransaction;
        notification.store = store;
        await notification.save()

        return notification;
    }

    async getManyAndCount({
        page,
        limit,
        search = '',
        customerId,
        employeeId,
        mode,
        visibleLastSent,
        type,
        queryObject,
        storeId,
        sortBy = 'notification.id',
        from,
        isAdmin

    }: NotificationQuery) {
        let where = `notification.isDeleted = false`;

        if (visibleLastSent === true) {
            where += ` AND IF(notification.mode != "${NotificationMode.Private}", notification.lastSentAt is not null, 1)`;
        }

        if (type) {
            where += ` AND notification.type = :type `
        }

        if (type === NotificationType.Normal) {
            where += ` AND customer.id is null`
        }

        if (customerId && storeId) { //lấy notification của khách hàng

            where += ` AND notification.from = "${NotificationFrom.Store}"
                AND (customer.id = :customerId OR (notification.mode = "${NotificationMode.Global}" AND store.id = :storeId)
                OR (notification.mode = "${NotificationMode.Group}" AND customers.id = :customerId))`
        }
        else if (storeId && !isAdmin) {
            where += ` AND store.id = :storeId `
        }

        if (isAdmin) {
            where += ` AND notification.from = "${NotificationFrom.Admin}"`
        }

        if (employeeId && !isAdmin) {
            where += ` AND (notification.from = "${NotificationFrom.Admin}" OR (notification.from = "${NotificationFrom.Customer}" AND store.id = :storeId))`
        }

        const query = Notification.createQueryBuilder('notification')
            .leftJoinAndSelect('notification.customer', 'customer')
            .leftJoinAndSelect('notification.groupCustomer', 'groupCustomer')
            .leftJoinAndSelect('groupCustomer.customers', 'customers')
            .leftJoinAndSelect('notification.news', 'news')
            .leftJoinAndSelect('notification.staffSent', 'staff')
            .leftJoinAndSelect('notification.product', 'product')
            .leftJoinAndSelect('notification.store', 'store')
            .leftJoinAndSelect('notification.order', 'order')
            .leftJoinAndSelect('notification.couponCampaign', 'couponCampaign')
            .leftJoinAndSelect('notification.promotionCampaign', 'promotionCampaign')

            .leftJoinAndSelect('promotionCampaign.promotionCampaignDetails', 'promotionCampaignDetails')
            .leftJoinAndSelect('promotionCampaignDetails.product', 'productCampaign')

            .leftJoinAndSelect('couponCampaign.customerCoupons', 'customerCoupon')
            .leftJoinAndSelect('customerCoupon.customer', 'customerCouponCampaign')
            .leftJoinAndSelect('couponCampaign.couponCampaignDetails', 'couponCampaignDetail')
            .leftJoinAndSelect('couponCampaignDetail.product', 'productCoupon')

            .leftJoinAndSelect('order.customer', 'customer2')
            .leftJoinAndSelect('order.onlinePayment', 'onlinePayment')
            .leftJoinAndSelect('order.details', 'orderDetail')
            .leftJoinAndSelect('order.gifts', 'gifts')
            .leftJoinAndSelect('gifts.product', 'product2')
            .leftJoinAndSelect('gifts.parent', 'parent')
            .leftJoinAndSelect('orderDetail.productVariation', 'productVariation')
            .leftJoinAndSelect('orderDetail.product', 'product3')
            .leftJoinAndSelect('product.productTax', 'productTax')
            .leftJoinAndSelect('order.productRates', 'productRate')
            //receipt
            .leftJoinAndSelect('order.orderReceipt', 'orderReceipt')
            .leftJoinAndSelect('orderReceipt.city', 'receiptCity')
            .leftJoinAndSelect('orderReceipt.district', 'receiptDistrict')
            .leftJoinAndSelect('orderReceipt.ward', 'receiptWard')
            //
            .leftJoinAndSelect('order.receiverCity', 'receiverCity')
            .leftJoinAndSelect('order.receiverDistrict', 'receiverDistrict')
            .leftJoinAndSelect('order.receiverWard', 'receiverWard')
            .leftJoinAndSelect('order.senderCity', 'senderCity')
            .leftJoinAndSelect('order.senderDistrict', 'senderDistrict')
            .leftJoinAndSelect('order.senderWard', 'senderWard')

            //
            .leftJoinAndSelect('order.canceledStaff', 'canceledStaff')
            .leftJoinAndSelect('order.canceledCustomer', 'canceledCustomer')
            .skip((page - 1) * limit)
            .take(limit)


        if (mode) {
            query.where(` notification.mode = :mode AND notification.isDeleted = false AND store.id = :storeId`, { mode, storeId });
        }
        else {
            query.where(where, { search: `%${search}%`, customerId, mode, type, storeId, from })
        }

        let isHasOrderBy = false

        if (queryObject) {
            const object = JSON.parse(queryObject) as QueryObject[];
            if (!Array.isArray(object)) {
                throw new BadRequest("Query object is not valid");
            }

            for (const item of object) {
                if (item.type == 'sort') {
                    query.addOrderBy(`${item.field}`, item.value)
                    isHasOrderBy = true;
                }

                else if (item.type == 'single-filter') {
                    const value = escape(item.value)
                    query.andWhere(`${item.field} LIKE '%${value}%'`)
                }

                else if (item.type == 'multi-filter') {
                    const value = item.value.map(e => `${escape(e)}`).join(', ');
                    query.andWhere(`${item.field} IN (${value})`)
                }
            }
        }

        if (!isHasOrderBy) {
            query.addOrderBy(sortBy, 'DESC')
        }

        if (customerId) {
            query.leftJoinAndSelect('notification.viewedCustomers', 'viewedCustomer', `viewedCustomer.id = ${customerId}`)
                .leftJoinAndSelect('notification.assignedCustomers', 'assignedCustomer')
        }

        if (employeeId) {
            query.leftJoinAndSelect('notification.viewedEmployees', 'viewedEmployee', `viewedEmployee.id = ${employeeId}`)
                .leftJoinAndSelect('notification.assignedEmployees', 'assignedEmployee', `assignedEmployee.id = ${employeeId}`)
        }

        let [notifications, total] = await query.getManyAndCount()


        return { notifications, total }
    }

    async createOrUpdate({ notification, orderId, newsId, productId, notificationId, store, from, groupCustomerId, couponCampaignId, promotionCampaignId }: NotificationCreateParams): Promise<Notification> {

        if (notificationId) {
            const notificationFound = await Notification.findOneOrThrowId(notificationId)
            notification.id = notificationFound.id
            notification.viewedCustomers = []
            notification.viewedEmployees = []
        }

        if (from) {
            notification.from = from
        }

        if (orderId) {
            await notification.assignOrder(orderId)
        }

        if (productId) {
            await notification.assignProduct(productId)
        }

        if (newsId) {
            await notification.assignNews(newsId)
        }

        if (store) {
            notification.store = store
        }

        if (groupCustomerId) {
            await notification.assignGroupCustomer(groupCustomerId, store)
            notification.mode = NotificationMode.Group
        }

        if (couponCampaignId) {
            await notification.assignCouponCampaign(couponCampaignId)
        }

        if (promotionCampaignId) {
            await notification.assignPromotionCampaign(promotionCampaignId)
        }

        await notification.save();

        return notification
    }

    async getTotalUnReadNotification(customerId?: number, store?: Store, employeeId?: number, from?: NotificationFrom) {


        if (customerId) {
            await Customer.findOneOrThrowId(customerId, {}, '');
        }

        if (employeeId) {
            await Employee.findOneOrThrowId(employeeId, {}, '');
        }

        let queryViewedNotification: SelectQueryBuilder<Notification>;

        if (customerId) {
            queryViewedNotification = Notification.createQueryBuilder('notification')
                .select('notification.id', 'id')
                .innerJoin('notification.viewedCustomers', 'viedCustomer', `viedCustomer.id = ${customerId}`)
        }

        if (employeeId) {
            queryViewedNotification = Notification.createQueryBuilder('notification')
                .select('notification.id', 'id')
                .innerJoin('notification.viewedEmployees', 'viedEmployee', `viedEmployee.id = ${employeeId}`)
        }

        let where = 'notification.isDeleted = false '

        if (customerId) {
            where += ` AND notification.lastSentAt != 0 AND notification.from = "${NotificationFrom.Store}" 
            AND store.id = :storeId
            AND notification.id NOT IN (${queryViewedNotification.getQuery()})
            AND notification.isDeleted = 0 AND (notification.mode = ${escape(NotificationMode.Global)} 
            OR notification.customerId = :customerId OR (notification.mode = "${NotificationMode.Group}" AND customers.id = :customerId)) `;
        }

        if (from == NotificationFrom.Admin && employeeId) {
            where += ` AND notification.id NOT IN (${queryViewedNotification.getQuery()})
             AND ((notification.from = ${escape(NotificationFrom.Admin)} AND notification.lastSentAt != 0)
             OR (notification.from = ${escape(NotificationFrom.Customer)} AND store.id = :storeId))
             `
        }

        else if (from) {
            where += ` AND notification.from = :from `
        }

        const query = Notification.createQueryBuilder('notification')
            .leftJoin('notification.store', 'store')
            .leftJoin('notification.groupCustomer', 'groupCustomer')
            .leftJoin('groupCustomer.customers', 'customers')
            .where(where, { storeId: store.id, employeeId, customerId, from })

        // console.log('total un-read query', query.getQuery());

        const count = await query
            .getCount();

        return count;

    }


    public async sendNotifications(notificationId: number, staff?: Staff, store?: Store, from?: NotificationFrom) {

        let where = "notification.id = :notificationId AND notification.isDeleted = false"

        if (store) {
            where += ` AND store.id = :storeId`
        }

        if (from) {
            where += ` AND notification.from = :from`
        }

        let notification: Notification;
        if (store) {
            notification = await Notification.createQueryBuilder("notification")
                .leftJoin("notification.store", "store")
                .leftJoinAndSelect('notification.groupCustomer', 'groupCustomer')
                .leftJoinAndSelect('groupCustomer.customers', 'customers')
                .where(where, { notificationId, storeId: store?.id })
                .getOne()
        } else {
            notification = await Notification.createQueryBuilder("notification")
                .where(where, { notificationId, from: NotificationFrom.Admin })
                .getOne()
        }

        if (!notification) {
            throw new BadRequest("Notification không tồn tại.")
        }

        let customers: Customer[] = [];

        const { title, type, news, order, product } = notification;

        let whereCustomer = 'customer.isDeleted = 0 AND customer.isBlocked = 0';

        if (store) {
            whereCustomer += ' AND store.id = :storeId'
        }

        let queryCustomer: SelectQueryBuilder<Customer>;

        if (store) {
            queryCustomer = Customer.createQueryBuilder('customer')
                .innerJoinAndSelect('customer.oneSignals', 'oneSignal')
                .leftJoinAndSelect('customer.store', "store")
                .where(whereCustomer, { storeId: store.id })
        }

        const limit = 100;
        const total = await queryCustomer.clone().getCount()
        const totalPages = Math.ceil(total / limit);
        let oneSignalIds: string[] = []

        let customerIds = []

        if (notification.groupCustomer) {
            customerIds = notification.groupCustomer.customers.map((item) => item.id)
        }

        if (customerIds.length) {
            queryCustomer.andWhere("customer.id In(:...customerIds)", { customerIds })
        }

        if (store) {
            for (let i = 1; i <= totalPages; i++) {
                const customerData = await queryCustomer.clone()
                    .skip((i - 1) * limit)
                    .take(limit)
                    .getMany()
                customers = [...customers, ...customerData];
                for (const customer of customerData) {
                    oneSignalIds = [...oneSignalIds, ...customer.oneSignals.map(e => e.oneSignalId)]
                }
            }
        }

        let whereEmployee = 'employee.isDeleted = 0 AND employee.isBlocked  = 0';

        const employees = await Employee.createQueryBuilder('employee')
            .innerJoinAndSelect('employee.oneSignals', 'oneSignal')
            .where(whereEmployee)
            .getMany()

        let data: any = {
            notificationId: notification.id + '',
            type
        }

        if (news) {
            data.newsId = news.id
        }

        if (product) {
            data.productId = product.id
        }

        if (order) {
            data.order = order.id
        }

        // gửi one signal customer (web)
        OneSignalUtil.pushNotification({
            heading: title,
            content: notification.shortContent,
            data,
            oneSignalPlayerIds: oneSignalIds,
            pathUrl: '/',
            userType: 'client'
        })

        //send notification to store
        const oneSignals = await OneSignal.createQueryBuilder('oneSignal')
            .innerJoin('oneSignal.employee', 'employee')
            .getMany()

        // gửi one signal store (web)
        OneSignalUtil.pushNotification({
            heading: title,
            content: notification.shortContent,
            data,
            oneSignalPlayerIds: oneSignals.map(e => e.oneSignalId),
            pathUrl: '/notification-store',
            userType: 'store'
        })

        notification.lastSentAt = moment().unix();
        if (staff) {
            notification.staffSent = staff;
        }
        notification.sendCount++;
        await notification.save();

        //gửi fcm (mobile)
        let queryFcmCustomer: SelectQueryBuilder<Customer>;

        if (store) {
            queryFcmCustomer = Customer.createQueryBuilder('customer')
                .leftJoinAndSelect('customer.store', "store")
                .where(whereCustomer, { storeId: store.id })
                .andWhere('customer.fcmToken != ""')
        }

        const totalFcm = await queryFcmCustomer.clone().getCount()
        const totalFcmPages = Math.ceil(totalFcm / limit)
        let fcmCustomers: Customer[] = [];

        if (customerIds.length) {
            queryFcmCustomer.andWhere("customer.id In(:...customerIds)", { customerIds })
        }

        if (store) {
            for (let i = 1; i <= totalFcmPages; i++) {
                const customerData = await queryFcmCustomer.clone()
                    .skip((i - 1) * limit)
                    .take(limit)
                    .getMany();

                fcmCustomers = [...fcmCustomers, ...customerData];
            }
        }

        await Firebase.send({
            message: {
                title,
                body: notification.shortContent,
                data
            },
            tokens: fcmCustomers.map(c => ({
                token: c.fcmToken,
                badgeCount: c.notificationBadgeCount + 1
            }))
        })

        for (const customer of fcmCustomers) {
            customer.notificationBadgeCount++;
        }

        for (const employee of employees) {
            employee.notificationBadgeCount++;
        }

        await Employee.save(employees)

        await Customer.save(fcmCustomers, {
            chunk: 100
        });
    }


    async getOne(notificationId: number) {
        const notification = await Notification.findOneOrThrowId(notificationId, {
            relations: ['customer', 'news', 'staffSent', 'product']
        }, '');

        return notification;
    }

    /**
     * gửi thông báo khi chia sẻ đăng kí / mua hàng
     */

    async handleWhenCompleteFromRefCustomer(customer: Customer, refCustomer: Customer, store: Store, totalPoints: number, product: Product) {
        let title = ''
        let content = ''

        if (product) {
            title = `Nhận điểm thưởng`
            content = `${store.name} gửi tặng quý khách ${totalPoints} điểm từ việc chia sẻ cho người mua hàng: ${customer.fullName} với sản phẩm ${product?.name}`
        } else {
            title = `Nhận điểm thưởng`
            content = `${store.name} gửi tặng quý khách ${totalPoints} điểm từ việc chia sẻ cho người đăng kí: ${customer.fullName}`
        }

        await this.create({
            customer: refCustomer,
            type: NotificationType.Normal,
            mode: NotificationMode.Private,
            shortContent: content,
            content,
            title,
            store: refCustomer.store
        })

        const data = {
            type: NotificationType.Normal
        }

        if (refCustomer.fcmToken) {
            Firebase.send({
                message: {
                    title,
                    body: content,
                    data
                },
                tokens: [{
                    badgeCount: refCustomer.notificationBadgeCount + 1,
                    token: refCustomer.fcmToken
                }]
            })
            console.log('send')
        }

        await Customer.createQueryBuilder()
            .update({
                notificationBadgeCount: () => `notificationBadgeCount + 1`
            })
            .where('id = :id', { id: refCustomer.id })
            .execute()

    }


    /**
     * gửi tin liên quan tới đơn hàng
     */
    async handleOrder(order: Order) {
        const { customer, store } = order;

        let title = '', body = '';
        const storeName = store.name

        switch (order.status) {

            case OrderStatus.Pending:
                title = `${storeName} tiếp nhận đơn hàng`;
                body = `${storeName} đã tiếp nhận đơn hàng #${order.code}.`
                break;

            case OrderStatus.Confirm:
                title = `${storeName} xác nhận đơn`;
                body = `${storeName} đã xác nhận đơn hàng #${order.code}.`
                break;

            case OrderStatus.Processing:
                title = `${storeName} đang xử lý đơn hàng`;
                body = `Đơn hàng #${order.code} đang được ${storeName} xử lý.`
                break;

            case OrderStatus.Delivering:
                title = 'Đơn của bạn đang được giao';
                body = `Đơn hàng #${order.code} của Quý Khách Hàng đã được bàn giao cho đơn vị vận chuyển.`
                break;

            case OrderStatus.ReturnRefund:
                title = 'Đơn của bạn đã được hoàn trả';
                body = `Đơn hàng #${order.code} của Quý Khách Hàng đã được hoàn trả. Chúng tôi sẽ hoàn trả số tiền cho bạn nếu bạn đã thanh toán bằng điểm hoặc thanh toán online`
                break;

            case OrderStatus.Complete:
                title = 'Đơn hàng đã được giao';
                body = `Đơn hàng #${order.code} của Quý Khách Hàng đã giao hoàn tất. ${storeName} xin tiếp nhận mọi đóng góp, khiếu nại qua Hotline và khẩn trương xác minh, phản hồi đến Quý Khách Hàng
                `;
                break;

            case OrderStatus.Cancel:
                title = 'Đơn hàng đã được hủy';
                body = `Đơn hàng #${order.code} của Quý Khách Hàng vừa bị hủy.`
                break;
        }


        if (title && body) {
            const oneSignals = await this.oneSignalService.getMany({
                customerId: customer.id
            })
            console.log('send oneSignals to customer:', oneSignals)

            const notification = await this.create({
                order,
                title,
                content: body,
                shortContent: body,
                customer,
                type: NotificationType.Order,
                mode: NotificationMode.Private,
                store
            })

            const data = {
                orderId: order.id + '',
                type: NotificationType.Order
            }

            oneSignals.length && OneSignalUtil.pushNotification({
                heading: title,
                content: body,
                data,
                oneSignalPlayerIds: oneSignals.map(e => e.oneSignalId),
                pathUrl: '/',
                userType: 'client'
            })

            if (customer.fcmToken) {
                Firebase.send({
                    message: {
                        title,
                        body,
                        data
                    },
                    tokens: [{
                        badgeCount: customer.notificationBadgeCount + 1,
                        token: customer.fcmToken
                    }]
                })
            }

            await Customer.createQueryBuilder()
                .update({
                    notificationBadgeCount: () => `notificationBadgeCount + 1`
                })
                .where('id = :id', { id: customer.id })
                .execute()
        }
    }

    /**
    * gửi notification khi khách hàng nhận coupon từ k.mãi của đơn hàng
    */
    async handleWhenCustomerReceiveCouponFromPromotion(customer: Customer, order: Order, couponCampaign: CouponCampaign, store: Store) {
        const { code } = order

        const title = 'Nhận phiếu coupon';
        const content = `${store.name} gửi tặng quý khách hàng 01 coupon ${couponCampaign.name} từ đơn hàng #${code}`


        await this.create({
            customer,
            order,
            type: NotificationType.Order,
            mode: NotificationMode.Private,
            shortContent: content,
            content,
            title
        })

        const data = {
            orderId: order.id + '',
            type: NotificationType.Order
        }


        if (customer.fcmToken) {
            Firebase.send({
                message: {
                    title,
                    body: content,
                    data
                },
                tokens: [{
                    badgeCount: customer.notificationBadgeCount + 1,
                    token: customer.fcmToken
                }]
            })
        }

        await Customer.createQueryBuilder()
            .update({
                notificationBadgeCount: () => `notificationBadgeCount + 1`
            })
            .where('id = :id', { id: customer.id })
            .execute()
    }

} //END FILE
