// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import { Summary } from '@tsed/schema';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Deposit, DepositStatus } from '../../entity/Deposit';
import { DepositService } from '../../services/DepositService';
import { CustomerTransactionType } from '../../entity/CustomerTransaction';
import { getCurrentTimeInt } from '../../util/helper';
import { BadRequest } from '@tsed/exceptions';
import { Customer } from '../../entity/Customer';
import { CustomerTransactionService } from '../../services/CustomerTransactionService';
import { NotificationService } from '../../services/NotificationService';

@Controller("/admin/deposit")
@Docs("docs_admin")
export class DepositController {
    constructor(
        private depositService: DepositService,
        private customerTransactionService: CustomerTransactionService,
        private notificationService: NotificationService
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
        @QueryParams('customerId') customerId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { deposits, total } = await this.depositService.getManyAndCount({
            limit,
            search,
            page,
            customerId
        })

        return res.sendOK({ deposits, total });
    }


    @Post('/transfer')
    @UseAuth(VerificationJWT)
    @Summary('Chuyển điểm')
    async transferC(
        @HeaderParams("token") token: string,
        @BodyParams('customerId') customerId: number,
        @BodyParams('amount') amount: number,
        @BodyParams('type') type: CustomerTransactionType,
        @BodyParams('expireBlockedAt') expireBlockedAt: number,
        @BodyParams('note') note: string,
        @Req() req: Request,
        @Res() res: Response
    ) {

        return res.sendOK({});
    }

} // END FILE
