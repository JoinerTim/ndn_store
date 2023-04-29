// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { QuickMessageService } from '../../services/QuickMessageService';
import { QuickMessage } from '../../entity/QuickMessage';

@Controller("/store/quickMessage")
@Docs("docs_store")
export class QuickMessageController {
    constructor(
        private quickMessageService: QuickMessageService
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


    // =====================CREATE ITEM=====================
    @Post('/')
    @UseAuth(VerificationJWT)
    @Validator({
        quickMessage: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("quickMessage") quickMessage: QuickMessage,
    ) {
        quickMessage.store = req.store
        await quickMessage.save();

        return res.sendOK(quickMessage)
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:quickMessageId')
    @UseAuth(VerificationJWT)
    @Validator({
        quickMessage: Joi.required(),
        quickMessageId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("quickMessage") quickMessage: QuickMessage,
        @PathParams("quickMessageId") quickMessageId: number,
    ) {
        await QuickMessage.findOneOrThrowId(quickMessageId, {
            where: {
                store: req.store
            }
        })
        quickMessage.content = quickMessage.content.trim();
        quickMessage.id = +quickMessageId
        await quickMessage.save()
        return res.sendOK(quickMessage)
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:quickMessageId')
    @UseAuth(VerificationJWT)
    @Validator({
        quickMessageId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("quickMessageId") quickMessageId: number,
    ) {
        const quickMessage = await QuickMessage.findOneOrThrowId(quickMessageId, {
            where: {
                store: req.store
            }
        })
        quickMessage.isDeleted = true

        await quickMessage.save()

        return res.sendOK(quickMessage)
    }

} // END FILE
