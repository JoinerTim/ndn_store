// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { ContentDefine, ContentDefineType } from '../../entity/ContentDefine';
import { UseNamespace } from '../../middleware/auth/UseNamespace';
import { StoreContentDefine } from '../../entity/StoreContentDefine';
import { ContentDefineService } from '../../services/ContentDefineService';


@Controller("/customer/contentDefine")
@Docs("docs_customer")
export class ContentDefineController {
    constructor(private contentDefineService: ContentDefineService) { }


    // =====================GET LIST=====================
    @Get('/type')
    @UseNamespace()
    @Validator({
        type: Joi.required()
    })
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams('type') type: ContentDefineType,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const store = req.store
        const contentDefine = await StoreContentDefine.createQueryBuilder('storeContentDefine')
            .leftJoin('storeContentDefine.store', 'store')
            .where('storeContentDefine.type = :type AND store.id = :storeId', { type, storeId: store.id })
            .getOne()

        if (!contentDefine) {
            await this.contentDefineService.initForStore(store)
        }
        return res.sendOK(contentDefine);
    }

} // END FILE
