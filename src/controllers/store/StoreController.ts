// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Store } from '../../entity/Store';
import { StoreService } from '../../services/StoreService';

@Controller("/store/store")
@Docs("docs_store")
export class StoreController {
    constructor(
        private storeService: StoreService
    ) { }


    // =====================GET LIST=====================
    @Get('')
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
        const { stores, total } = await this.storeService.getManyAndCount({
            limit,
            search,
            page
        })

        return res.sendOK({ stores, total });
    }

    @Get('/:storeId')
    @Validator({
        storeId: Joi.number().required()
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('storeId') storeId: number
    ) {
        const store = await this.storeService.getOne(storeId)
        return res.sendOK(store)
    }

} // END FILE
