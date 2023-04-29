// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { OnlinePayment } from '../../entity/OnlinePayment';
import { OnlinePaymentService } from '../../services/OnlinePaymentService';

@Controller("/store/onlinePayment")
@Docs("docs_store")
export class OnlinePaymentController {
    constructor(
        private onlinePaymentService: OnlinePaymentService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100)
    })
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams("search") search: string = "",
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { onlinePayments, total } = await this.onlinePaymentService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id
        })

        return res.sendOK({ onlinePayments, total });
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        onlinePayment: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("onlinePayment") onlinePayment: OnlinePayment,
    ) {
        onlinePayment.store = req.store;
        await onlinePayment.save()
        return res.sendOK(onlinePayment)
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:onlinePaymentId')
    @UseAuth(VerificationJWT)
    @Validator({
        onlinePayment: Joi.required(),
        onlinePaymentId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("onlinePayment") onlinePayment: OnlinePayment,
        @PathParams("onlinePaymentId") onlinePaymentId: number,
    ) {
        await OnlinePayment.findOneOrThrowId(onlinePaymentId, {
            where: {
                store: req.store
            }
        })
        onlinePayment.id = +onlinePaymentId
        await onlinePayment.save()

        return res.sendOK(onlinePayment)
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:onlinePaymentId')
    @UseAuth(VerificationJWT)
    @Validator({
        onlinePaymentId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("onlinePaymentId") onlinePaymentId: number,
    ) {
        const onlinePayment = await OnlinePayment.findOneOrThrowId(onlinePaymentId, {
            where: {
                store: req.store
            }
        })
        await onlinePayment.delete()

        return res.sendOK({})
    }

} // END FILE
