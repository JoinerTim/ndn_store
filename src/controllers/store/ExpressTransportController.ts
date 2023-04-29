// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';

// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { ExpressTransport } from '../../util/expressTransport';
import { TransportCaculateOrderFee, TransportLeadTimeParams, TransportOrderCodUpdate, TransportOrderInsert, TransportStoreInsert } from '../../entity-request/TransportOrderInsert';

@Controller("/store/expressTransport")
@Docs("docs_store")
export class ExpressTransportController {

    constructor() {

    }

    @Get('/store/getAllStore')
    @UseAuth(VerificationJWT)
    async getAllStore(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @QueryParams("offset") offset: number,
        @QueryParams("limit") limit: number,
        @QueryParams("client_phone") client_phone: string,
    ) {
        const data = await ExpressTransport.getAllStore({ offset, limit, client_phone })
        return res.sendOK(data)
    }

    @Get('/store/getStation')
    @UseAuth(VerificationJWT)
    async getStation(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @QueryParams("district_id") district_id: string,
        @QueryParams("ward_code") ward_code: string,
        @QueryParams("offset") offset: number,
        @QueryParams("limit") limit: number,
    ) {
        const data = await ExpressTransport.getStation({ offset, limit, ward_code, district_id })
        return res.sendOK(data)
    }


    @Get('/store/getAllfeeOfOrder')
    @UseAuth(VerificationJWT)
    async getAllFeeOfOrder(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @QueryParams("orderCode") orderCode: string,
        @QueryParams("shopId") shopId: number,
    ) {
        const data = await ExpressTransport.getAllFeeOfOrder(orderCode, shopId)
        return res.sendOK(data)
    }

    @Get('/store/getService')
    @UseAuth(VerificationJWT)
    @Validator({
        from_district: Joi.number().required(),
        to_district: Joi.number().required(),
        shop_id: Joi.number().required(),
    })
    async getService(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @QueryParams("from_district") from_district: number,
        @QueryParams("to_district") to_district: number,
        @QueryParams("shop_id") shop_id: number,
    ) {
        const data = await ExpressTransport.getService({ from_district, to_district, shop_id })
        return res.sendOK(data)
    }


    @Post('/store/leadTime')
    @UseAuth(VerificationJWT)
    async leadTime(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("leadTime") leadTime: TransportLeadTimeParams,
        @BodyParams("shopId") shopId: number
    ) {
        const data = await ExpressTransport.leadTime(leadTime, shopId)
        return res.sendOK(data)
    }

    @Post('/store/caculateFee')
    @UseAuth(VerificationJWT)
    async caculateFee(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("caculateOrderFee") caculateOrderFee: TransportCaculateOrderFee,
        @BodyParams("shopId") shopId: number
    ) {
        const data = await ExpressTransport.caculateOrderFee(caculateOrderFee, shopId)
        return res.sendOK(data)
    }


    @Post('/store/createOrder')
    @UseAuth(VerificationJWT)
    @Validator({
        order: Joi.required(),
    })
    async createOrder(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("order") order: TransportOrderInsert,
        @BodyParams("shopId") shopId: number,
    ) {
        const data = await ExpressTransport.createOrder(order, shopId)

        return res.sendOK(data)
    }


    @Post('/store/previewOrder')
    @UseAuth(VerificationJWT)
    @Validator({
        order: Joi.required(),
    })
    async previewOrder(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("order") order: TransportOrderInsert,
        @BodyParams("shopId") shopId: number,
    ) {
        const data = await ExpressTransport.previewOrder(order, shopId)

        return res.sendOK(data)
    }


    @Post('/store/createStore')
    @UseAuth(VerificationJWT)
    @Validator({
        store: Joi.required(),
    })
    async createStore(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("store") store: TransportStoreInsert,
    ) {
        const data = await ExpressTransport.createStore(store)
        return res.sendOK({ data })
    }

    @Patch('/order/updateOrder')
    @UseAuth(VerificationJWT)
    @Validator({
        order: Joi.required(),
    })
    async updateOrder(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("order") order: TransportOrderInsert,
        @BodyParams("shopId") shopId: number,
    ) {
        const data = await ExpressTransport.updateOrder(order, shopId)

        return res.sendOK(data)
    }

    @Post('/order/getOrderDetail')
    @UseAuth(VerificationJWT)
    @Validator({
        orderCode: Joi.required()
    })
    async getOrderDetail(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('orderCode') orderCode: string
    ) {
        const data = await ExpressTransport.getOrderDetail(orderCode)
        return res.sendOK(data)
    }

    @Get('/order/getOrderByClientCode')
    @UseAuth(VerificationJWT)
    async getOrderByClientCode(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams('clientOrderCode') clientOrderCode: string
    ) {
        const data = await ExpressTransport.getOrderByClientOrderCode(clientOrderCode)
        return res.sendOK(data)
    }

    @Get('/order/getShiftDate')
    @UseAuth(VerificationJWT)
    async getShiftDate(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const data = await ExpressTransport.getShiftDate()
        return res.sendOK(data)
    }

    @Get('/address/getProvince')
    @UseAuth(VerificationJWT)
    async getProvince(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const data = await ExpressTransport.getProvince()
        return res.sendOK(data)
    }

    @Get('/address/getDistrict')
    @UseAuth(VerificationJWT)
    async getDistrict(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams('provinceId') provinceId: number
    ) {
        const data = await ExpressTransport.getDistrict(provinceId)
        return res.sendOK(data)
    }

    @Get('/address/getWard')
    @UseAuth(VerificationJWT)
    async getWard(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams('districtId') districtId: number
    ) {
        const data = await ExpressTransport.getWard(districtId)
        return res.sendOK(data)
    }

    @Post('/order/deliveryAgain')
    @UseAuth(VerificationJWT)
    @Validator({
        orderCodes: Joi.required()
    })
    async deliveryAgain(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('orderCodes', String) orderCodes: string[],
        @BodyParams("shopId") shopId: number,
    ) {
        const data = await ExpressTransport.deliveryAgain(orderCodes, shopId)
        return res.sendOK(data)
    }


    @Patch('/order/updateOrderCOD')
    @UseAuth(VerificationJWT)
    @Validator({
        orderCodUpdate: Joi.required()
    })
    async updateOrderCOD(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('orderCodUpdate') orderCodUpdate: TransportOrderCodUpdate,
    ) {
        const data = await ExpressTransport.updateCOD(orderCodUpdate)
        return res.sendOK(data)
    }

} // END FILE
