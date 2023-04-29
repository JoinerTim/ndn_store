// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { CustomerCoupon } from '../../entity/CustomerCoupon';
import { CustomerCouponService } from '../../services/CustomerCouponService';

@Controller("/customer/customerCoupon")
@Docs("docs_customer")
export class CustomerCouponController {
    constructor(
        private customerCouponService: CustomerCouponService
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
        @QueryParams('isUsed') isUsed: boolean,
        @QueryParams('isExpired') isExpired: boolean,
        @QueryParams('search') search: string = '',
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { customerCoupons, total } = await this.customerCouponService.getManyAndCount({
            limit,
            search,
            page,
            customerId: req.customer.id,
            isUsed,
            isExpired,
        })

        return res.sendOK({ customerCoupons, total });
    }

    @Get('/:customerCouponId')
    @UseAuth(VerificationJWT)
    @Validator({
        customerCouponId: Joi.required()
    })
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('customerCouponId') customerCouponId: number
    ) {
        const customerCoupon = await this.customerCouponService.getOne(customerCouponId)
        return res.sendOK(customerCoupon)
    }

} // END FILE
