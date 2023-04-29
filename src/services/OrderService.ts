// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";
import { OrderDetailInsert } from "../entity-request/OrderDetailInsert";


// IMPORT CUSTOM
import { Order } from "../entity/Order";
import { OrderDetail } from "../entity/OrderDetail";
import { getIntervalFromDate } from "../util/helper";
import { NotificationService } from "./NotificationService";
import { DeliveryStatus, OrderCancelBy, OrderStatus } from "../types/order";
import { QueryObject } from "../types/query";
import { PaymentStatus } from "../types/order";
import { escape } from "mysql2";
import { Staff } from "../entity/Staff";
import { Customer } from "../entity/Customer";
import { EPaymentType } from "../enum";
import { CustomerTransactionService } from "./CustomerTransactionService";
import { OrderLogService } from "./OrderLogService";
import { OrderLogType } from "../entity/OrderLog";
import { FlashSaleCampaignDetail } from "../entity/FlashSaleCampaignDetail";
import { OrderReceiptInsert } from "../entity-request/OrderReceiptInsert";
import { WarehouseService } from "./WarehouseService";
import { FlashSaleCampaignService } from "./FlashSaleCampaignService";
import { Product } from "../entity/Product";
import { Store } from "../entity/Store";
import { CustomerRef } from "../controllers/customer";
import { ProductTax } from "../entity/ProductTax";
import { Warehouse } from "../entity/Warehouse";

interface OrderQuery {
    page: number;
    limit: number
    search?: string;
    customerId?: number;
    deliveryStatus?: DeliveryStatus
    fromDate?: string;
    toDate?: string;
    status?: OrderStatus
    queryObject?: string
    isRated?: boolean
    storeId?: number
    hasReceipt?: boolean
    orderIds?: number[]
}

interface CreateOrderParams {
    customerId: number;
    order: Order,
    orderReceiptInsert: OrderReceiptInsert,
    details: OrderDetailInsert[],
    cityId: number,
    districtId: number,
    wardId: number,
    onlinePaymentId: number,
    storeId: number,
    couponCampaignId: number,
    customerCouponId: number,
    promotionCampaignIds: number[],
    refCustomerId?: number,
}

@Service()
export class OrderService {
    constructor(
        private notificationService: NotificationService,
        private customerTransactionService: CustomerTransactionService,
        private orderLogService: OrderLogService,
        private warehouseService: WarehouseService,
        private flashSaleCampaignService: FlashSaleCampaignService
    ) {

    }

    isExistRefId(customerRefs: CustomerRef[], id: number) {
        if (!customerRefs.length) {
            return false
        }
        const refIds = customerRefs.map((item) => item.id)
        return refIds.includes(id)
    }

    async handleCalcTotalPointRef(details: OrderDetail[], customersRef: CustomerRef[]) {
        for (const detail of details) {

            //get product tax
            const productTax = await ProductTax.createQueryBuilder('productTax')
                .leftJoinAndSelect('productTax.products', 'products')
                .where('products.id = :productId', { productId: detail.product.id })
                .getOne()

            let moneyTax = 0

            if (productTax) {
                moneyTax = detail.finalPrice * (productTax.value / 100)
            }

            customersRef.map(async (item) => {
                if (detail.refCustomer && detail.product.refPoint && item.id === detail.refCustomer.id && item.productRefs.includes(detail.product.id)) {
                    item.totalPoints += detail.quantity * detail.finalPrice * detail.product.refPoint / 100
                } else if (detail.refCustomer && item.id === detail.refCustomer.id && item.productRefs.includes(detail.product.id)) {
                    const product = await Product.createQueryBuilder('product')
                        .leftJoinAndSelect('product.productCategory', 'productCategory')
                        .where('product.id = :productId', { productId: detail.product.id })
                        .getOne()
                    if (product.productCategory.refPoint) {
                        item.totalPoints += detail.quantity * detail.finalPrice * product.productCategory.refPoint / 100
                    }
                }
            })

        }

        return customersRef
    }


    async create({
        cityId,
        districtId,
        wardId,
        couponCampaignId,
        customerCouponId,
        customerId,
        details,
        onlinePaymentId,
        order,
        orderReceiptInsert,
        promotionCampaignIds,
        storeId,
        refCustomerId,
    }: CreateOrderParams) {
        await order.assignCustomer(customerId)
        const { customer } = order

        const orderReceipt = orderReceiptInsert ? await orderReceiptInsert.toOrderReceipt() : undefined;

        if (couponCampaignId) {
            await order.assignCouponCampaign(couponCampaignId)
        }

        if (customerCouponId) {
            await order.assignCustomerCoupon(customerCouponId)
        }

        if (cityId) await order.assignReceiverCity(cityId)
        if (districtId) await order.assignReceiverDistrict(districtId)
        if (wardId) await order.assignReceiverWard(wardId)

        if (refCustomerId) await order.assignRefCustomer(refCustomerId)

        if (storeId) await order.assignStore(storeId)

        if (order.paymentMethod == EPaymentType.Online && !onlinePaymentId) {
            throw new BadRequest("Chưa chọn loại thanh toán online.");
        }

        if (onlinePaymentId) await order.assignOnlinePayment(onlinePaymentId)


        if (promotionCampaignIds?.length) {
            await order.assignPromotionCampaigns(promotionCampaignIds)
        }

        //tính tiền
        await this.estimate(order, details, customerId);

        //validate promotion, flash sale
        for (const detail of order.details) {
            if (detail.isExpiredPromotion) {
                throw new BadRequest(`Khuyến mãi của sản phẩm '${detail.product.name}' đã quá hạn.`);
            }

            if (detail.isExpiredFlashSale) {
                throw new BadRequest(`FlashSale của sản phẩm '${detail.product.name}' đã quá hạn.`);
            }

            if (detail.isOutOfStockFlashSale) {
                throw new BadRequest(`FlashSale của sản phẩm '${detail.product.name}' không đủ số lượng để bán.`);
            }
        }

        if (order.isExpiredCoupon) {
            throw new BadRequest("Mã coupon đã hết hạn.");
        }

        if (order.couponMsg) {
            throw new BadRequest(order.couponMsg);
        }

        if (order.paymentMethod == EPaymentType.Balance && order.moneyFinal > customer.balance) {
            throw new BadRequest("Số dư không đủ để thanh toán đơn hàng");
        }

        //

        await OrderDetail.save(order.details);
        await OrderDetail.save(order.gifts);

        await order.generateCode();

        if (order.paymentMethod == EPaymentType.Balance) {
            order.paymentStatus = PaymentStatus.Complete
        }

        await this.warehouseService.handleWhenCreateOrder(order.details);
        await order.save();

        //tính lại chu kỳ mua hàng
        await order.customer.calcBuyCycle()

        //xử lý hàng kho

        //xử lý flash sale
        await this.flashSaleCampaignService.handleWhenCreateOrder(order.id)

        //gửi notification cho khách
        await this.notificationService.handleOrder(order)

        if (orderReceipt) {
            orderReceipt.order = order;
            await orderReceipt.save()
        }

        if (order.paymentMethod == EPaymentType.Balance) {
            this.customerTransactionService.handleWhenBuyOrder(customer, order)
        }

        //xử lý coupon khách hàng sử dụng
        if (order.customerCoupon) {
            order.customerCoupon.isUsed = true;
            await order.customerCoupon.save()
        }

        return order;
    }

    async getManyAndCount({
        page,
        limit,
        search = '',
        customerId,
        fromDate,
        toDate,
        status,
        queryObject,
        isRated,
        storeId,
        hasReceipt,
        orderIds,
        deliveryStatus
    }: OrderQuery) {
        let where = `CONCAT(order.code,' ', customer.phone, ' ', order.receiverName, ' ') LIKE :search AND order.isDeleted = false`;

        if (customerId) {
            where += ` AND customer.id = :customerId`
        }

        if (fromDate && toDate) {
            const { start, end } = getIntervalFromDate(fromDate, toDate)
            where += ` AND order.createdAt BETWEEN ${start} AND ${end}`;
        }

        if (status) {
            where += ` AND order.status = :status`;
        }

        if (isRated == true) {
            where += ` AND productRate.id is not null`
        }

        if (isRated == false) {
            where += ` AND productRate.id is null`
        }

        if (deliveryStatus) {
            where += ' AND order.deliveryStatus = :deliveryStatus'
        }


        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        if (hasReceipt == true) {
            where += ' AND orderReceipt.id is not null'
        }

        if (hasReceipt == false) {
            where += ' AND orderReceipt.id is null'
        }

        if (orderIds?.length) {
            where += ' AND order.id IN (:...orderIds)';
        }

        const query = Order.createQueryBuilder('order')
            .innerJoinAndSelect('order.customer', 'customer')
            .leftJoinAndSelect('order.onlinePayment', 'onlinePayment')
            .leftJoinAndSelect('order.details', 'orderDetail')
            .leftJoinAndSelect('order.gifts', 'gifts')
            .leftJoinAndSelect('gifts.product', 'product2')
            .leftJoinAndSelect('gifts.parent', 'parent')
            .leftJoinAndSelect('orderDetail.productVariation', 'productVariation')
            .leftJoinAndSelect('orderDetail.product', 'product')
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
            .leftJoinAndSelect('order.store', 'store')

            //
            .leftJoinAndSelect('order.canceledStaff', 'canceledStaff')
            .leftJoinAndSelect('order.canceledCustomer', 'canceledCustomer')
            //
            .where(where, { search: `%${search}%`, customerId, status, storeId, orderIds, deliveryStatus })

        if (queryObject) {
            const object = JSON.parse(queryObject) as QueryObject[];
            if (!Array.isArray(object)) {
                throw new BadRequest("Query object is not valid");
            }

            for (const item of object) {
                if (item.type == 'sort') {
                    query.addOrderBy(`${item.field}`, item.value)
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

        const [orders, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .addOrderBy('order.id', 'DESC')
            .getManyAndCount()

        return { orders, total }
    }

    async getOne(orderId: number) {
        const order = await Order.createQueryBuilder('order')
            .innerJoinAndSelect('order.customer', 'customer')

            //store
            .leftJoinAndSelect('order.store', 'store')
            .leftJoinAndSelect('store.ward', 'storeWard')
            .leftJoinAndSelect('store.district', 'storeDistrict')
            .leftJoinAndSelect('store.city', 'storeCity')

            .leftJoinAndSelect('order.onlinePayment', 'onlinePayment')
            .leftJoinAndSelect('order.details', 'orderDetail')
            .leftJoinAndSelect('orderDetail.product', 'product')
            .leftJoinAndSelect('product.productTax', 'productTax')
            .leftJoinAndSelect('orderDetail.productVariation', 'productVariation')
            .leftJoinAndSelect('order.productRates', 'productRate')
            .leftJoinAndSelect('productRate.images', 'images')
            .leftJoinAndSelect('productRate.product', 'product2')
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
            .leftJoinAndSelect('order.gifts', 'gifts')
            .leftJoinAndSelect('gifts.product', 'product3')
            .leftJoinAndSelect('gifts.parent', 'parent')

            //promotion, flash sale, coupon
            .leftJoinAndSelect('order.promotionCampaigns', 'promotionCampaigns')
            .leftJoinAndSelect('promotionCampaigns.couponCampaign', 'couponCampaign')
            //coupon
            .leftJoinAndSelect('order.customerCoupon', 'customerCoupon')
            .leftJoinAndSelect('order.giftedCustomerCoupon', 'giftedCustomerCoupon')
            .leftJoinAndSelect('giftedCustomerCoupon.couponCampaign', 'couponCampaign2')
            //
            .leftJoinAndSelect('orderDetail.flashSaleCampaignDetail', 'flashSaleCampaignDetail')
            .leftJoinAndSelect('flashSaleCampaignDetail.flashSaleCampaign', 'flashSaleCampaign')

            .leftJoinAndSelect('orderDetail.promotionCampaignDetail', 'promotionCampaignDetail')
            .leftJoinAndSelect('promotionCampaignDetail.promotionCampaign', 'promotionCampaign')

            .leftJoinAndSelect('orderDetail.giftPromotionCampaignDetail', 'giftPromotionCampaignDetail')
            .leftJoinAndSelect('giftPromotionCampaignDetail.promotionCampaign', 'giftPromotionCampaign')

            //
            .leftJoinAndSelect('order.canceledStaff', 'canceledStaff')
            .leftJoinAndSelect('order.canceledCustomer', 'canceledCustomer')
            //
            .where(`order.id = :orderId`, { orderId })
            .getOne()

        return order;
    }


    async estimate(order: Order, details: OrderDetailInsert[], customerId?: number) {
        const orderDetails: OrderDetail[] = await Promise.all(details.map(d => d.toOrderDetail(customerId)));

        order.status = OrderStatus.Pending;
        order.details = orderDetails;
        await order.calcMoney();

        return order;
    }


    /**
     * Hoàn trả đơn, k giao được hàng
     */
    async handleReturnRefundOrder(orderId: number, staff: Staff = null, customer: Customer = null) {
        const order = await Order.createQueryBuilder('order')
            .leftJoinAndSelect('order.details', 'orderDetail', 'orderDetail.isGift = 0')
            .innerJoinAndSelect('orderDetail.product', 'product')
            .leftJoinAndSelect('order.customer', 'customer')
            .where('order.id = :orderId', {
                orderId
            })
            .getOne()

        if (order.status == OrderStatus.ReturnRefund) {
            throw new BadRequest("Đơn hàng đã được hoàn trả");
        }

        if (order.status != OrderStatus.Delivering && order.status != OrderStatus.Complete) {
            throw new BadRequest(`Không thể hoàn đơn. Trạng thái hiện tại: ${order.status}`);
        }

        const oldOrderStatus = order.status;
        order.status = OrderStatus.ReturnRefund;

        if (order.paymentMethod == EPaymentType.Balance) {
            await this.customerTransactionService.handleWhenCancelOrder(order.customer, order)
            order.paymentStatus = PaymentStatus.Refund;
        }

        if (oldOrderStatus == OrderStatus.Delivering) {
            order.deliveryStatus = DeliveryStatus.Fail
        }

        await order.save();

        (async () => {
            for (const detail of order.details) {
                const warehouse = await Warehouse.createQueryBuilder('warehouse')
                    .leftJoinAndSelect('warehouse.product', 'product')
                    .leftJoinAndSelect('warehouse.depot', 'depot')
                    .where('product.id = :productId', { productId: detail.product.id })
                    .getOne();
                if (oldOrderStatus == OrderStatus.Complete) {
                    warehouse.sold -= detail.quantity
                    warehouse.product.sold -= detail.quantity
                    await warehouse.product.save()
                    await warehouse.save()
                }
                if (oldOrderStatus == OrderStatus.Delivering) {
                    warehouse.pending -= detail.quantity
                    warehouse.product.pending -= detail.quantity
                    await warehouse.product.save()
                    await warehouse.save()
                }
            }
        })()


        //tính lại chu kỳ mua hàng
        await order.customer.calcBuyCycle()

        this.orderLogService.create({
            status: order.status,
            staff,
            customer,
            order,
            type: OrderLogType.UpdateStatus
        })

        this.notificationService.handleOrder(order)
    }

    /**
     * Hoàn trả 
     */
    async handleRefundPayment(orderId: number, staff: Staff) {
        const order = await Order.findOneOrThrowId(orderId, null, '')

        if (order.paymentStatus == PaymentStatus.Refund) {
            throw new BadRequest("Đơn hàng đã được hoàn tiền");
        }

        if (order.paymentStatus == PaymentStatus.Pending) {
            throw new BadRequest("Đơn hàng chưa được thanh toán");
        }

        order.paymentStatus = PaymentStatus.Refund
        await order.save();

        this.orderLogService.create({
            staff,
            order,
            type: OrderLogType.RefundPayment,
        })
    }


    /**
     * Hủy đơn
     */
    async handleCancelOrder(orderId: number, staff: Staff, customer: Customer, store: Store) {
        const order = await Order.findOneOrThrowId(orderId, {
            relations: [
                'customer',
                'customerCoupon',
                'details',
                'details.flashSaleCampaignDetail',
                'details.refCustomer',
            ],
            where: {
                store
            }
        }, '');

        if (order.status != OrderStatus.Pending) {
            throw new BadRequest(`Không thể hủy đơn. Trạng thái hiện tại: ${order.status}`);
        }

        order.status = OrderStatus.Cancel;
        order.canceledCustomer = customer
        order.canceledStaff = staff;
        order.cancelBy = staff ? OrderCancelBy.Staff : OrderCancelBy.Customer;
        await order.save();


        //tính lại chu kỳ mua hàng
        await order.customer.calcBuyCycle()

        if (order.paymentMethod == EPaymentType.Balance) {
            this.customerTransactionService.handleWhenCancelOrder(order.customer, order)
        }

        //reverse quantity flash sale
        for (const orderDetail of order.details) {
            if (orderDetail.refCustomer) {
                orderDetail.refCustomer.isDeleted = true
                await orderDetail.refCustomer.save()
            }

            if (!orderDetail.flashSaleCampaignDetail) {
                continue;
            }

            await FlashSaleCampaignDetail.createQueryBuilder()
                .update()
                .set({
                    pending: () => `pending - ${orderDetail.quantity}`
                })
                .where('id = :id', { id: orderDetail.flashSaleCampaignDetail.id })
                .execute()
        }

        //reverse coupon
        if (order.customerCoupon) {
            order.customerCoupon.isUsed = false;
            await order.customerCoupon.save()
        }

        this.orderLogService.create({
            status: order.status,
            staff,
            customer,
            order,
            type: OrderLogType.UpdateStatus
        })

        this.notificationService.handleOrder(order)

        await this.warehouseService.handleWhenCancelOrder(orderId)
    }
} //END FILE
