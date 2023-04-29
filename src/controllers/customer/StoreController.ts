// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Store } from '../../entity/Store';
import { StoreService } from '../../services/StoreService';
import { DepotService } from '../../services/DepotService';
import { UseAuthHash } from '../../middleware/auth/UseAuthHash';

@Controller("/customer/store")
@Docs("docs_customer")
export class StoreController {
    constructor(
        private storeService: StoreService,
        private depotService: DepotService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @Validator({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100)
    })
    @UseAuthHash()
    async findAll(
        @HeaderParams("token") token: string,
        @HeaderParams("is-dev") isDev: boolean,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams("search") search: string = "",
        @QueryParams('areaId') areaId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { stores, total } = await this.storeService.getManyAndCount({
            limit,
            search,
            page,
            areaId
        })

        return res.sendOK({ stores, total });
    }

    @Get('/namespace')
    @UseAuthHash()
    @Validator({
        namespace: Joi.required()
    })
    async getByNamespace(
        @HeaderParams("token") token: string,
        @HeaderParams("is-dev") isDev: boolean,
        @QueryParams('namespace') namespace: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const store = await Store.findOneOrThrowOption({
            relations: ["area", "city", "district", "benefitPackage", "ward"],
            where: {
                namespace,
                isDeleted: false
            }
        })

        return res.sendOK(store);
    }

    @Get('/:storeId')
    @Validator({
        storeId: Joi.required()
    })
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('storeId') storeId: number
    ) {
        const store = await this.storeService.getOne(storeId)
        return res.sendOK(store)
    }

} // END FILE
