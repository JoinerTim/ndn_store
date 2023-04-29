// IMPORT LIBRARY
import { Controller, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Patch, Post } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import { Summary, Enum } from '@tsed/schema';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Order } from '../../entity/Order';
import { OrderService } from '../../services/OrderService';
import { DeliveryStatus, OrderStatus, PaymentStatus } from '../../types/order';
import { OrderLogService } from '../../services/OrderLogService';
import { BadRequest } from '@tsed/exceptions';
import { OrderLogType } from '../../entity/OrderLog';
import { NotificationService } from '../../services/NotificationService';
import { CustomerTransactionService } from '../../services/CustomerTransactionService';
import { WarehouseService } from '../../services/WarehouseService';
import { FlashSaleCampaignService } from '../../services/FlashSaleCampaignService';
import { CustomerCouponService } from '../../services/CustomerCouponService';
import { OrderDetailInsert } from '../../entity-request/OrderDetailInsert';
import { OrderReceiptInsert } from '../../entity-request/OrderReceiptInsert';
import { EPaymentType } from '../../enum';
import { UseAuthHash } from '../../middleware/auth/UseAuthHash';

@Controller("/store/order")
@Docs("docs_store")
export class OrderController {
    constructor(
        private orderService: OrderService,
        private orderLogService: OrderLogService,
        private notificationService: NotificationService,
        private customerTransactionService: CustomerTransactionService,
        private warehouseService: WarehouseService,
        private flashSaleCampaignService: FlashSaleCampaignService,
        private customerCouponService: CustomerCouponService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @UseAuth(VerificationJWT)
    @UseAuthHash()
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0)
    })
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @QueryParams("search") search: string = "",
        @QueryParams('status') status: OrderStatus,
        @QueryParams('customerId') customerId: number,
        @QueryParams('queryObject') queryObject: string,
        @QueryParams('fromDate') fromDate: string,
        @QueryParams('toDate') toDate: string,
        @QueryParams('isRated') isRated: boolean,
        @QueryParams('hasReceipt') hasReceipt: boolean,
        @QueryParams('deliveryStatus') @Enum(DeliveryStatus) deliveryStatus: DeliveryStatus,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { orders, total } = await this.orderService.getManyAndCount({
            limit,
            search,
            page,
            status,
            customerId,
            queryObject,
            fromDate,
            toDate,
            isRated,
            storeId: req.store.id,
            hasReceipt,
            deliveryStatus
        });

        return res.sendOK({ orders, total });
    }


    @Get('/flashSale')
    @UseAuth(VerificationJWT)
    @UseAuthHash()
    @Summary("Ds đơn sử dụng flash sale")
    @Validator({
        flashSaleCampaignId: Joi.required()
    })
    async getOrderUseFlashSale(
        @HeaderParams("token") token: string,
        @QueryParams('flashSaleCampaignId') flashSaleCampaignId: number,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const statuses = [OrderStatus.Cancel, OrderStatus.ReturnRefund];
        let where = 'order.isDeleted = 0 AND order.status NOT IN (:...statuses) AND store.id = :storeId'

        const data = await Order.createQueryBuilder('order')
            .select('order.id', 'id')
            .innerJoin('order.details', 'orderDetail')
            .innerJoin('orderDetail.flashSaleCampaignDetail', 'flashSaleCampaignDetail')
            .innerJoin('flashSaleCampaignDetail.flashSaleCampaign', 'flashSaleCampaign', 'flashSaleCampaign.id = :flashSaleCampaignId', { flashSaleCampaignId })
            .innerJoin('order.store', 'store')
            .where(where, {
                statuses,
                storeId: req.store.id
            })
            .getRawMany()

        const { orders, total } = await this.orderService.getManyAndCount({
            limit,
            page,
            orderIds: data.map(e => e.id)
        });

        return res.sendOK({
            orders,
            total
        })
    }

    @Get('/discountOrder')
    @UseAuth(VerificationJWT)
    @UseAuthHash()
    @Summary("Ds đơn sử dụng giảm giá đơn hàng")
    @Validator({
        promotionCampaignId: Joi.required()
    })
    async getOrderUseDiscountOrder(
        @HeaderParams("token") token: string,
        @QueryParams('promotionCampaignId') promotionCampaignId: number,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const statuses = [OrderStatus.Cancel, OrderStatus.ReturnRefund];
        let where = 'order.isDeleted = 0 AND order.status NOT IN (:...statuses) AND store.id = :storeId'

        const data = await Order.createQueryBuilder('order')
            .select('order.id', 'id')
            .innerJoin('order.promotionCampaigns', 'promotionCampaign', 'promotionCampaign.id = :promotionCampaignId', {
                promotionCampaignId
            })
            .innerJoin('order.store', 'store')
            .where(where, {
                statuses,
                storeId: req.store.id
            })
            .getRawMany()

        if (!data.length) {
            return res.sendOK({
                orders: [],
                total: 0
            })
        }

        const { orders, total } = await this.orderService.getManyAndCount({
            limit,
            page,
            orderIds: data.map(e => e.id)
        });

        return res.sendOK({
            orders,
            total
        })
    }

    @Get('/discountProduct')
    @UseAuthHash()
    @UseAuth(VerificationJWT)
    @Summary("Ds đơn sử dụng giảm giá sản phẩm")
    @Validator({
        promotionCampaignId: Joi.required()
    })
    async getOrderUseDiscountProduct(
        @HeaderParams("token") token: string,
        @QueryParams('promotionCampaignId') promotionCampaignId: number,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const statuses = [OrderStatus.Cancel, OrderStatus.ReturnRefund];
        let where = 'order.isDeleted = 0 AND order.status NOT IN (:...statuses) AND store.id = :storeId'

        const data = await Order.createQueryBuilder('order')
            .select('order.id', 'id')
            .innerJoin('order.details', 'orderDetail')
            .innerJoin('orderDetail.promotionCampaignDetail', 'promotionCampaignDetail')
            .innerJoin('promotionCampaignDetail.promotionCampaign', 'promotionCampaign', 'promotionCampaign.id = :promotionCampaignId', { promotionCampaignId })
            .innerJoin('order.store', 'store')
            .where(where, {
                statuses,
                storeId: req.store.id
            })
            .getRawMany()

        if (!data.length) {
            return res.sendOK({
                orders: [],
                total: 0
            })
        }

        const { orders, total } = await this.orderService.getManyAndCount({
            limit,
            page,
            orderIds: data.map(e => e.id)
        });



        return res.sendOK({
            orders,
            total
        })
    }

    @Get('/coupon')
    @UseAuthHash()
    @UseAuth(VerificationJWT)
    @Summary("Ds đơn sử dụng coupon")
    @Validator({
        couponCampaignId: Joi.required()
    })
    async getOrderUseCoupon(
        @HeaderParams("token") token: string,
        @QueryParams('couponCampaignId') couponCampaignId: number,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const statuses = [OrderStatus.Cancel, OrderStatus.ReturnRefund]
        let where = 'order.status NOT IN (:...statuses) AND store.id = :storeId'
        const data = await Order.createQueryBuilder('order')
            .select('order.id', 'id')
            .leftJoin('order.store', 'store')
            .innerJoin('order.couponCampaign', 'couponCampaign', 'couponCampaign.id = :couponCampaignId', {
                couponCampaignId,
                statuses,
                storeId: req.store.id
            })
            .where(where)
            .getRawMany()

        if (!data.length) {
            return res.sendOK({
                orders: [],
                total: 0
            })
        }

        const { orders, total } = await this.orderService.getManyAndCount({
            limit,
            page,
            orderIds: data.map(e => e.id)
        });


        return res.sendOK({
            orders,
            total
        })
    }

    @Post('/estimate')
    @UseAuthHash()
    @Summary('Estimate đơn hàng')
    @UseAuth(VerificationJWT)
    @Validator({
        order: Joi.required(),
        customerId: Joi.required()
    })
    async estimate(
        @HeaderParams("token") token: string,
        @BodyParams('order') order: Order,
        @BodyParams('details', OrderDetailInsert) details: OrderDetailInsert[],
        @BodyParams('cityId') cityId: number,
        @BodyParams('districtId') districtId: number,
        @BodyParams('wardId') wardId: number,
        @BodyParams('couponCampaignId') couponCampaignId: number,
        @BodyParams('customerCouponId') customerCouponId: number,
        @BodyParams('promotionCampaignIds', Number) promotionCampaignIds: number[],
        @BodyParams('customerId') customerId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const storeId = req.store.id;
        await order.assignCustomer(customerId);

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

        await this.orderService.estimate(order, details);

        return res.sendOK(order)
    }

    @Patch('/:orderId/receiverAddress')
    @Summary("Cập nhật địa chỉ giao")
    @UseAuthHash()
    @UseAuth(VerificationJWT)
    @Validator({
        orderId: Joi.number().required()
    })
    async updateReceiverAddress(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("orderId") orderId: number,
        @BodyParams('receiverAddress') receiverAddress: string,
        @BodyParams('receiverCityId') receiverCityId: number,
        @BodyParams('receiverDistrictId') receiverDistrictId: number,
        @BodyParams('receiverWardId') receiverWardId: number,
        @BodyParams('isReceiveAtStore') isReceiveAtStore: boolean,
    ) {
        const order = await Order.findOneOrThrowId(orderId, {
            relations: ['store']
        })

        if (!isReceiveAtStore) {
            await order.assignReceiverCity(receiverCityId)
            await order.assignReceiverDistrict(receiverDistrictId)
            await order.assignReceiverWard(receiverWardId)
        }

        order.receiverAddress = receiverAddress;
        order.isReceiveAtStore = isReceiveAtStore;
        order.shipFee = await order.calcShipFee()
        order.moneyFinal = order.subTotalMoney + order.moneyVat + order.shipFee - order.moneyDiscountShipFee
        await order.calcPointRefund();

        order.id = +orderId;

        await order.save()

        return res.sendOK(order)
    }

    @Post('')
    @Summary('Tạo đơn hàng')
    @UseAuth(VerificationJWT)
    @UseAuthHash()
    @Validator({
        order: Joi.required(),
        details: Joi.array().min(1),
        customerId: Joi.required()
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
        @BodyParams('customerId') customerId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        await this.orderService.create({
            order,
            orderReceiptInsert,
            details,
            cityId,
            districtId,
            wardId,
            onlinePaymentId,
            storeId: req.store.id,
            couponCampaignId,
            customerCouponId,
            promotionCampaignIds,
            customerId
        })

        res.sendOK(order);
    }

    @Get('/summary/total')
    @UseAuth(VerificationJWT)
    @UseAuthHash()
    async getSummaryTotal(
        @HeaderParams("token") token: string,
        @QueryParams('customerId') customerId: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const storeId = req.store.id
        let where = 'order.isDeleted = 0 AND store.id = :storeId AND store.id = :storeId';


        if (customerId) {
            where += ` AND customer.id = :customerId`
        }

        const data = await Order.createQueryBuilder('order')
            .select('order.status', 'status')
            .addSelect('COUNT(*)', 'total')
            .leftJoin('order.store', 'store')
            .leftJoin('order.customer', 'customer')
            .groupBy('order.status')
            .where(where, {
                storeId,
                customerId
            })
            .getRawMany()

        return res.sendOK(data)
    }

    @Patch('/:orderId/note')
    @UseAuth(VerificationJWT)
    @UseAuthHash()
    @Validator({
        orderId: Joi.required()
    })
    async updateNote(
        @HeaderParams("token") token: string,
        @PathParams('orderId') orderId: number,
        @BodyParams('note') note: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const order = await Order.findOneOrThrowId(orderId, {
            where: {
                store: req.store
            }
        }, '');

        order.note = note;
        await order.save();

        return res.sendOK(order)
    }

    @Patch('/:orderId/cancel')
    @UseAuth(VerificationJWT)
    @UseAuthHash()
    @Validator({
        orderId: Joi.number().required()
    })
    async cancel(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("orderId") orderId: number,
    ) {
        await this.orderService.handleCancelOrder(orderId, req.staff, null, req.store)

        return res.sendOK({})
    }

    @Patch('/:orderId/confirm')
    @UseAuth(VerificationJWT)
    @UseAuthHash()
    @Validator({
        orderId: Joi.number().required()
    })
    async confirm(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("orderId") orderId: number,
    ) {
        const order = await Order.findOneOrThrowId(orderId, {
            relations: ['customer'],
            where: {
                store: req.store
            }
        }, '');

        if (order.status != OrderStatus.Pending) {
            throw new BadRequest(`Không thể xác nhận đơn. Trạng thái hiện tại: ${order.status}`);
        }

        order.status = OrderStatus.Confirm;

        //Xác nhận đã thanh toán qua thẻ onlne
        if (order.paymentMethod == EPaymentType.Online) {
            order.paymentStatus = PaymentStatus.Complete;
        }

        await order.save();

        this.orderLogService.create({
            status: order.status,
            staff: req.staff,
            order,
            type: OrderLogType.UpdateStatus
        })

        this.notificationService.handleOrder(order)

        return res.sendOK({})
    }


    @Patch('/:orderId/processing')
    @UseAuth(VerificationJWT)
    @UseAuthHash()
    @Validator({
        orderId: Joi.number().required()
    })
    async processing(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("orderId") orderId: number,
    ) {
        const order = await Order.findOneOrThrowId(orderId, {
            relations: ['customer'],
            where: {
                store: req.store
            }
        }, '');

        if (order.status != OrderStatus.Confirm) {
            throw new BadRequest(`Không thể xử lý đơn. Trạng thái hiện tại: ${order.status}`);
        }

        order.status = OrderStatus.Processing;
        await order.save();

        this.orderLogService.create({
            status: order.status,
            staff: req.staff,
            order,
            type: OrderLogType.UpdateStatus
        });

        this.notificationService.handleOrder(order)

        return res.sendOK({})
    }

    @Patch('/:orderId/delivering')
    @UseAuthHash()
    @UseAuth(VerificationJWT)
    @Validator({
        orderId: Joi.number().required()
    })
    async delivering(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("orderId") orderId: number,
    ) {
        const order = await Order.findOneOrThrowId(orderId, {
            relations: ['customer'],
            where: {
                store: req.store
            }
        }, '');

        if (order.status != OrderStatus.Processing) {
            throw new BadRequest(`Không thể giao đơn. Trạng thái hiện tại: ${order.status}`);
        }

        order.status = OrderStatus.Delivering;
        await order.save();

        this.orderLogService.create({
            status: order.status,
            staff: req.staff,
            order,
            type: OrderLogType.UpdateStatus
        })

        this.notificationService.handleOrder(order)

        return res.sendOK({})
    }

    @Patch('/:orderId/return')
    @UseAuth(VerificationJWT)
    @UseAuthHash()
    @Summary("Hoàn trả hàng, không giao đc hàng")
    @Validator({

    })
    async returnRefundOrder(
        @HeaderParams("token") token: string,
        @PathParams('orderId') orderId: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        await this.orderService.handleReturnRefundOrder(orderId, req.staff)
        return res.sendOK({});
    }

    @Patch('/:orderId/refundPayment')
    @UseAuth(VerificationJWT)
    @UseAuthHash()
    @Summary("Xác nhận đã refund tiền")
    async refundPayment(
        @HeaderParams("token") token: string,
        @PathParams('orderId') orderId: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        await this.orderService.handleRefundPayment(orderId, req.staff)
        return res.sendOK({});
    }


    @Patch('/:orderId/complete')
    @UseAuth(VerificationJWT)
    @UseAuthHash()
    @Validator({
        orderId: Joi.number().required()
    })
    async complete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("orderId") orderId: number,
    ) {
        const order = await Order.findOneOrThrowId(orderId, {
            relations: ['customer', 'customer.customerRank', 'refCustomer', 'details', 'details.product', 'details.refCustomer']
        }, '');

        if (order.status != OrderStatus.Delivering) {
            throw new BadRequest(`Không thể hoàn thành đơn. Trạng thái hiện tại: ${order.status}`);
        }

        order.status = OrderStatus.Complete;
        order.deliveryStatus = DeliveryStatus.Complete
        order.paymentStatus = PaymentStatus.Complete;

        await order.save();

        //promotion có coupon;
        this.customerCouponService.handleWhenCompleteOrder(order.id, req.store)

        this.orderLogService.create({
            status: order.status,
            staff: req.staff,
            order,
            type: OrderLogType.UpdateStatus
        })

        await this.notificationService.handleOrder(order);

        //transaction
        await this.customerTransactionService.handleWhenCompleteOrder(order.customer, order)

        await this.flashSaleCampaignService.handleWhenCompleteOrder(order.id);
        const employee = req.employee
        await this.warehouseService.handleWhenCompleteOrder(order.id, employee);

        return res.sendOK({})
    }

    @Get('/:orderId')
    @UseAuth(VerificationJWT)
    @UseAuthHash()
    @Validator({
        orderId: Joi.required()
    })
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('orderId') orderId: number
    ) {
        const order = await this.orderService.getOne(orderId)
        return res.sendOK(order)
    }
} // END FILE
