// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { OnlinePayment } from '../../entity/OnlinePayment';
import { OnlinePaymentService } from '../../services/OnlinePaymentService';
import { UseNamespace } from '../../middleware/auth/UseNamespace';

@Controller("/customer/onlinePayment")
@Docs("docs_customer")
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
    @UseNamespace()
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
} // END FILE
