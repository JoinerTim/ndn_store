// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Enum } from '@tsed/schema';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { CustomerTransaction, CustomerTransactionType } from '../../entity/CustomerTransaction';
import { CustomerTransactionService } from '../../services/CustomerTransactionService';

@Controller("/customer/customerTransaction")
@Docs("docs_customer")
export class CustomerTransactionController {
    constructor(
        private customerTransactionService: CustomerTransactionService
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
        @QueryParams('type') @Enum(CustomerTransactionType) type: CustomerTransactionType,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { customerTransactions, total } = await this.customerTransactionService.getManyAndCount({
            limit,
            search,
            page,
            customerId: req.customer.id,
            type,
            isCompleted: true
        })

        return res.sendOK({ customerTransactions, total });
    }

} // END FILE
