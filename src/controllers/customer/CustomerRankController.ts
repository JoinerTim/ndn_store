// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { CustomerRank } from '../../entity/CustomerRank';
import { CustomerRankService } from '../../services/CustomerRankService';
import { UseNamespace } from '../../middleware/auth/UseNamespace';

@Controller("/customer/customerRank")
@Docs("docs_customer")
export class CustomerRankController {
    constructor(
        private customerRankService: CustomerRankService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @UseAuth(VerificationJWT)
    @UseNamespace()
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
        const { customerRanks, total } = await this.customerRankService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id
        })

        return res.sendOK({ customerRanks, total });
    }

} // END FILE
