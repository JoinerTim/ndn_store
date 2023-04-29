// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import { Summary, Enum, Patch } from '@tsed/schema';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Order } from '../../entity/Order';
import { OrderDetailInsert } from '../../entity-request/OrderDetailInsert';
import { OrderDetail } from '../../entity/OrderDetail';
import { OrderService } from '../../services/OrderService';
import { NotificationService } from '../../services/NotificationService';
import { OrderStatus } from '../../types/order';
import { WarehouseService } from '../../services/WarehouseService';
import { FlashSaleCampaignService } from '../../services/FlashSaleCampaignService';
import { BadRequest } from '@tsed/exceptions';
import { EPaymentType } from '../../enum';
import { CustomerTransactionService } from '../../services/CustomerTransactionService';
import { ProductService } from '../../services/ProductService';
import { OrderReceiptInsert } from '../../entity-request/OrderReceiptInsert';
import { escape } from 'mysql2';
import { OneSignal } from '../../entity/OneSignal';
import { OneSignalUtil } from '../../util/oneSignal';
import { UseNamespace } from '../../middleware/auth/UseNamespace';
import { Notification, NotificationFrom, NotificationMode, NotificationType } from '../../entity/Notification';
import { RefCustomer, RefCustomerType } from '../../entity/RefCustomer';
import { ProductRefPoint, ProductRefPointType } from '../../entity/ProductRefPoint';
import { Product } from '../../entity/Product';
import { Store } from '../../entity/Store';


export interface CustomerRef {
    id: number,
    totalPoints: number,
    productRefs: number[]
}

@Controller("/customer/order")
@Docs("docs_customer")
export class OrderController {
    constructor(
        private orderService: OrderService,
        private notificationService: NotificationService,
        private warehouseService: WarehouseService,
        private flashSaleCampaignService: FlashSaleCampaignService,
        private customerTransactionService: CustomerTransactionService,
        private productService: ProductService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0)
    })
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @QueryParams("search") search: string = "",
        @QueryParams('fromDate') fromDate: string,
        @QueryParams('isRated') isRated: boolean,
        @QueryParams('toDate') toDate: string,
        @QueryParams('status') @Enum(OrderStatus) status: OrderStatus,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { orders, total } = await this.orderService.getManyAndCount({
            limit,
            search,
            page,
            customerId: req.customer.id,
            fromDate,
            toDate,
            status,
            isRated
        })
        return res.sendOK({ orders, total });
    }

    @Get('/summary/status')
    @UseAuth(VerificationJWT)
    async getSummaryTotal(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        let where = 'order.isDeleted = 0';

        const data = await Order.createQueryBuilder('order')
            .select('order.status', 'status')
            .addSelect('COUNT(*)', 'total')
            .innerJoin('order.customer', 'customer', 'customer.id = :customerId', {
                customerId: req.customer.id
            })
            .groupBy('order.status')
            .where(where)
            .getRawMany();

        const completeOrderQuery = Order.createQueryBuilder('order')
            .select('order.id', 'id')
            .leftJoin('order.productRates', 'productRate')
            .where(`order.customerId = ${req.customer.id} AND order.status = ${escape(OrderStatus.Complete)}`)

        //complete (k có rate)
        const data2 = await Order.createQueryBuilder('order')
            .addSelect('COUNT(*)', 'total')
            .where(where)
            .andWhere(`order.id IN (${completeOrderQuery.clone().andWhere('productRate.id is NULL').getQuery()})`)
            .getRawOne()

        data.push({
            status: 'COMPLETED_NOT_RATE',
            total: data2.total
        })

        //
        const data3 = await Order.createQueryBuilder('order')
            .addSelect('COUNT(*)', 'total')
            .where(where)
            .andWhere(`order.id IN (${completeOrderQuery.clone().andWhere('productRate.id is NOT NULL').getQuery()})`)
            .getRawOne()

        data.push({
            status: 'COMPLETED_RATE',
            total: data3.total
        })

        return res.sendOK(data)
    }


    @Get('/:orderId')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0)
    })
    async findOne(
        @HeaderParams("token") token: string,
        @HeaderParams("is-dev") isDev: string,
        @PathParams('orderId') orderId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const order = await this.orderService.getOne(orderId)
        res.sendOK(order)
    }

    @Post('/cart/check')
    @Summary('Kiểm tra giỏ hàng: hết hạn promotion, flash sale, sp bị xóa')
    @Validator({
        storeId: Joi.required()
    })
    async checkCart(
        @HeaderParams("token") token: string,
        @BodyParams('details', OrderDetailInsert) details: OrderDetailInsert[] = [],
        @BodyParams('storeId') storeId: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const orderDetails: OrderDetail[] = await Promise.all(details.map(d => d.toOrderDetail()));

        const { products } = await this.productService.getManyAndCount({
            page: 1, limit: 0, productIds: orderDetails.filter(e => e.isGift = false).map(e => e.product.id), storeId
        })

        await this.productService.mapPromotion(products, storeId)
        this.productService.mapFlashSale(products)

        for (const detail of orderDetails) {
            const find = products.find(e => e.id == detail.product.id)
            if (find) {
                detail.product = find;
            }
        }

        return res.sendOK(orderDetails);
    }

    @Post('/estimate')
    @Summary('Estimate đơn hàng')
    @UseAuth(VerificationJWT)
    @Validator({
        order: Joi.required(),
        storeId: Joi.required()
    })
    async estimate(
        @HeaderParams("token") token: string,
        @HeaderParams('is-dev') isDev: boolean,
        @BodyParams('order') order: Order,
        @BodyParams('details', OrderDetailInsert) details: OrderDetailInsert[],
        @BodyParams('cityId') cityId: number,
        @BodyParams('districtId') districtId: number,
        @BodyParams('wardId') wardId: number,
        @BodyParams('storeId') storeId: number,
        @BodyParams('couponCampaignId') couponCampaignId: number,
        @BodyParams('customerCouponId') customerCouponId: number,
        @BodyParams('promotionCampaignIds', Number) promotionCampaignIds: number[],
        @Req() req: Request,
        @Res() res: Response
    ) {
        await order.assignCustomer(req.customer.id);

        if (cityId) await order.assignReceiverCity(cityId)
        if (districtId) await order.assignReceiverDistrict(districtId)
        if (wardId) await order.assignReceiverWard(wardId)

        if (promotionCampaignIds?.length) {
            await order.assignPromotionCampaigns(promotionCampaignIds)
        }

        if (storeId) await order.assignStore(storeId)

        if (couponCampaignId) await order.assignCouponCampaign(couponCampaignId)

        if (customerCouponId) {
            await order.assignCustomerCoupon(customerCouponId)
        }

        await this.orderService.estimate(order, details, req.customer.id);

        return res.sendOK(order)
    }

    @Post('')
    @Summary('Tạo đơn hàng')
    @UseAuth(VerificationJWT)
    @UseNamespace()
    @Validator({
        order: Joi.required(),
        details: Joi.array().min(1)
    })
    async create(
        @HeaderParams("token") token: string,
        @BodyParams('order') order: Order,
        @BodyParams('orderReceipt') orderReceiptInsert: OrderReceiptInsert,
        @BodyParams('details', OrderDetailInsert) details: OrderDetailInsert[],
        @BodyParams('cityId') cityId: number,
        @BodyParams('districtId') districtId: number,
        @BodyParams('wardId') wardId: number,
        @BodyParams('onlinePaymentId') onlinePaymentId: number,
        @BodyParams('couponCampaignId') couponCampaignId: number,
        @BodyParams('customerCouponId') customerCouponId: number,
        @BodyParams('promotionCampaignIds', Number) promotionCampaignIds: number[],
        @Req() req: Request,
        @Res() res: Response
    ) {
        const storeId = req.store.id
        const customer = req.customer

        const orderData = await this.orderService.create({
            order,
            orderReceiptInsert,
            details,
            cityId,
            districtId,
            wardId,
            onlinePaymentId,
            storeId,
            couponCampaignId,
            customerCouponId,
            promotionCampaignIds,
            customerId: req.customer.id
        })

        let customersRef: CustomerRef[] = [];

        //lấy thông tin Referral trong chi tiết đơn hàng
        orderData.details.map((detail) => {
            if (detail.refCustomer && this.orderService.isExistRefId(customersRef, detail.refCustomer.id)) {
                customersRef = customersRef.map((ref) => {
                    if (ref.id === detail.refCustomer.id) {
                        ref.productRefs.push(detail.product.id)
                        ref.totalPoints = 0
                    }
                    return ref
                })
            } else if (detail.refCustomer) {
                customersRef.push({
                    id: detail.refCustomer.id,
                    totalPoints: 0,
                    productRefs: [detail.product.id]
                })
            }
        })

        customersRef = await this.orderService.handleCalcTotalPointRef(orderData.details, customersRef)

        //lưu lịch sử Referral 
        const refCustomerDatas = await Promise.all(customersRef.map(async (item) => {

            const productRefPoints: ProductRefPoint[] = []
            for (const productId of item.productRefs) {
                const product = await Product.createQueryBuilder('product')
                    .leftJoinAndSelect('product.store', 'store')
                    .leftJoinAndSelect('product.productCategory', 'productCategory')
                    .where('product.isDeleted = false AND product.id = :productId AND store.id = :storeId', { productId, storeId })
                    .getOne()

                if (product) {
                    const productRefPoint = new ProductRefPoint()
                    productRefPoint.product = product
                    productRefPoint.price = product.finalPrice
                    productRefPoint.refPoint = product.refPoint || product?.productCategory?.refPoint || 0
                    if (product.refPoint) {
                        productRefPoint.type = ProductRefPointType.Product
                    } else if (product.productCategory.refPoint) {
                        productRefPoint.type = ProductRefPointType.Category
                    }
                    productRefPoints.push(productRefPoint)
                }
            }

            const productRefpointsSave = await ProductRefPoint.save(productRefPoints)
            const refCustomer = new RefCustomer()
            refCustomer.totalPoint = item.totalPoints
            await refCustomer.assignCustomer(item.id)
            refCustomer.order = order
            refCustomer.type = RefCustomerType.Order
            refCustomer.productRefPoints = productRefpointsSave

            return refCustomer
        }))

        await RefCustomer.save(refCustomerDatas)

        res.sendOK(order)

        //send notification to store

        const notification = new Notification();
        notification.title = `Đơn hàng mới`;
        notification.content = `Đơn hàng #${order.code} vừa được tạo.`;
        notification.shortContent = `Đơn hàng #${order.code} vừa được tạo.`;
        notification.order = order;
        notification.customer = customer;
        notification.type = NotificationType.Order;
        notification.mode = NotificationMode.Private;
        notification.from = NotificationFrom.Customer;
        notification.store = req.store;
        await notification.save()

        const oneSignals = await OneSignal.createQueryBuilder('oneSignal')
            .innerJoin('oneSignal.employee', 'employee')
            .where('(employee.storeId is null OR employee.store = :storeId)', {
                storeId
            })
            .getMany()

        if (oneSignals) {
            await OneSignalUtil.pushNotification({
                heading: 'Đơn hàng mới',
                content: `Đơn hàng #${order.code} vừa được tạo`,
                data: {
                    type: 'ORDER',
                    orderId: order.id + ''
                },
                oneSignalPlayerIds: oneSignals.map(e => e.oneSignalId),
                pathUrl: '/order',
                userType: 'store'
            })
        }
        //
    }

    @Patch('/:orderId/rated')
    @UseAuth(VerificationJWT)
    @Validator({
        orderId: Joi.number().required()
    })
    @Summary("Đánh dấu đã rate order")
    async ratedOrder(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("orderId") orderId: number,
        @BodyParams('isHaspoint') isHaspoint: boolean = true,
    ) {
        const order = await Order.findOneOrThrowId(orderId)

        if (!order.isRated) {
            if (isHaspoint) {
                await Order.createQueryBuilder()
                    .update({
                        isRated: true
                    })
                    .where('id = :orderId', { orderId })
                    .execute();

                await this.customerTransactionService.handleWhenRateOrder(orderId)
            }

            res.sendOK({})
        } else {
            return res.sendAPI({}, 'Rated', false, 200)
        }
    }

    @Patch('/:orderId/cancel')
    @UseAuth(VerificationJWT)
    @UseNamespace()
    @Validator({
        orderId: Joi.number().required()
    })
    async cancel(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("orderId") orderId: number,
    ) {
        await this.orderService.handleCancelOrder(orderId, null, req.customer, req.store)

        return res.sendOK({})
    }

} // END FILE
