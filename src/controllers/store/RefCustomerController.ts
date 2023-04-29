import {
    Controller,
    UseAuth,
    Req,
    Get,
    Res,
    Response,
    HeaderParams,
    PathParams,
    Post,
    BodyParams,
    Patch,
    QueryParams,
} from "@tsed/common";
import Joi from "@hapi/joi";
import { Docs } from "@tsed/swagger";
import { Request } from "express";
import { Enum } from '@tsed/schema';


import { Validator } from "../../middleware/validator/Validator";
import { VerificationJWT } from "../../middleware/auth/VerificationJWT";
import { RefCustomerService } from "../../services/RefCustomerService";
import { RefCustomer, RefCustomerType } from "../../entity/RefCustomer";

@Controller("/store/refCustomer")
@Docs("docs_store")
export class RefCustomerController {

    constructor(
        private refCustomerService: RefCustomerService
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
        @QueryParams("isConfirmed") isConfirmed: boolean,
        @QueryParams("productId") productId: number,
        @QueryParams('type') @Enum(RefCustomerType) type: RefCustomerType,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { refCustomers, total } = await this.refCustomerService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id,
            isConfirmed,
            type,
            productId
        })
        return res.sendOK({ refCustomers, total });
    }

    @Get('/:refCustomerId')
    @UseAuth(VerificationJWT)
    @Validator({
        refCustomerId: Joi.required()
    })
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('refCustomerId') refCustomerId: number
    ) {
        const refCustomer = await this.refCustomerService.getOne(refCustomerId, req.store.id)
        return res.sendOK(refCustomer)
    }


} // END FILE
