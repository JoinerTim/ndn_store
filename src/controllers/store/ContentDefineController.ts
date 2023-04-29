// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { ContentDefine } from '../../entity/ContentDefine';
import { ContentDefineService } from '../../services/ContentDefineService';
import { Forbidden } from '@tsed/exceptions';
import { StoreContentDefine } from '../../entity/StoreContentDefine';


@Controller("/store/contentDefine")
@Docs("docs_store")
export class ContentDefineController {
    constructor(
        private contentDefineService: ContentDefineService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @UseAuth(VerificationJWT)
    async findAll(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const store = req.store
        const { contentDefines, total } = await this.contentDefineService.getForStore(req.store)
        if(contentDefines.length < 1) {
            await this.contentDefineService.initForStore(store)
        }
        return res.sendOK({ contentDefines, total });
    }


    @Post('/init')
    @UseAuth(VerificationJWT)
    async init(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        await this.contentDefineService.initForStore(req.store)

        return res.sendOK({})
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:contentDefineId')
    @UseAuth(VerificationJWT)
    @Validator({
        contentDefine: Joi.required(),
        contentDefineId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("contentDefine") contentDefine: StoreContentDefine,
        @PathParams("contentDefineId") contentDefineId: number,
    ) {
        await ContentDefine.findOneOrThrowId(contentDefineId)
        contentDefine.id = +contentDefineId
        await contentDefine.save()

        return res.sendOK(contentDefine)
    }

} // END FILE
