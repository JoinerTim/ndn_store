// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { ProductRate } from "../entity/ProductRate";
import { Order } from "../entity/Order";
import { Product } from "../entity/Product";
import { Notification, NotificationFrom, NotificationMode, NotificationType } from "../entity/Notification";
import { Store } from "../entity/Store";
import { Customer } from "../entity/Customer";
import { OneSignalUtil } from "../util/oneSignal";
import { OneSignal } from "../entity/OneSignal";

interface ProductRateQuery {
    page: number;
    limit: number
    search?: string;
    productId?: number;
    star?: number;
    storeId?: number;
    customerId?: number;
}
@Service()
export class ProductRateService {

    async getManyAndCount({
        page = 1,
        limit = 10,
        search = '',
        productId,
        storeId,
        star,
        customerId
    }: ProductRateQuery) {
        let where = `productRate.isDeleted = false AND product.name LIKE :search`

        if (productId) {
            where += ` AND product.id = :productId`
        }

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        if (star) {
            where += ` AND productRate.star  = :star`
        }

        if (customerId) {
            where += ` AND customer.id = :customerId`
        }

        const [productRates, total] = await ProductRate.createQueryBuilder('productRate')
            .leftJoinAndSelect('productRate.product', 'product')
            .leftJoinAndSelect('productRate.customer', 'customer')
            .leftJoin('customer.store', 'store')
            .leftJoinAndSelect('productRate.order', 'order')
            .leftJoinAndSelect('productRate.images', 'media')
            .where(where, { search: `%${search}%`, productId, storeId, star, customerId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('productRate.id', 'DESC')
            .getManyAndCount()

        return { productRates, total }
    }

    async getOne(productRateId: number, storeId?: number) {

        let where = `productRate.isDeleted = false AND productRate.id = :productRateId`

        if (storeId) {
            where += ` AND store.id = :storeId`
        }
        const productRate = await ProductRate.createQueryBuilder('productRate')
            .leftJoinAndSelect('productRate.product', 'product')
            .leftJoinAndSelect('productRate.customer', 'customer')
            .leftJoin('customer.store', 'store')
            .leftJoinAndSelect('productRate.order', 'order')
            .leftJoinAndSelect('productRate.images', 'media')
            .where(where, { productRateId, storeId })

        return productRate
    }

    async sendNotification(order: Order, product: Product, productRate: ProductRate, store: Store, customer: Customer) {
        const notification = new Notification();
        notification.title = `Sản phẩm đã được đánh giá`;
        notification.content = `Sản phẩm thuộc đơn hàng ${order.id} được ${customer.id} đánh giá ${productRate.star} sao với nội dung: ${productRate.content}.`;
        notification.shortContent = `Sản phẩm thuộc đơn hàng ${order.id} được ${customer.id} đánh giá ${productRate.star} sao với nội dung: ${productRate.content}.`;
        notification.order = order;
        notification.customer = customer;
        notification.type = NotificationType.Product;
        notification.mode = NotificationMode.Private;
        notification.from = NotificationFrom.Customer;
        notification.store = store;
        await notification.save()

        // gửi one signal store (web)
        const oneSignals = await OneSignal.createQueryBuilder('oneSignal')
            .innerJoin('oneSignal.employee', 'employee')
            .innerJoin('employee.store', 'store')
            .where('store.id = :storeId', { storeId: store.id })
            .getMany()
        const data = {
            orderId: order.id + '',
            type: NotificationType.Order
        }
        OneSignalUtil.pushNotification({
            heading: notification.title,
            content: notification.shortContent,
            data,
            oneSignalPlayerIds: oneSignals.map(e => e.oneSignalId),
            pathUrl: '/notification-store',
            userType: 'store'
        })

    }
} //END FILE
