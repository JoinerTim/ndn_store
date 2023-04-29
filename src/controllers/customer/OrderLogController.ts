// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { OrderLog } from '../../entity/OrderLog';
import { OrderLogService } from '../../services/OrderLogService';

@Controller("/customer/orderLog")
@Docs("docs_customer")
export class OrderLogController {
    constructor(
        private orderLogService: OrderLogService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100),
        orderId: Joi.required()
    })
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams("search") search: string = "",
        @QueryParams('orderId') orderId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { orderLogs, total } = await this.orderLogService.getManyAndCount({
            limit,
            search,
            page,
            orderId
        })

        return res.sendOK({ orderLogs, total });
    }

} // END FILE
