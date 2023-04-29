// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { QuickMessageService } from '../../services/QuickMessageService';
import { QuickMessage } from '../../entity/QuickMessage';
import { UseNamespace } from '../../middleware/auth/UseNamespace';

@Controller("/customer/quickMessage")
@Docs("docs_customer")
export class QuickMessageController {
    constructor(
        private quickMessageService: QuickMessageService
    ) { }


    // =====================GET LIST=====================
    @Get('')
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
        const { quickMessages, total } = await this.quickMessageService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id
        })

        return res.sendOK({ quickMessages, total });
    }

} // END FILE
