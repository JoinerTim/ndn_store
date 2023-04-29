// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Popup } from '../../entity/Popup';
import { PopupService } from '../../services/PopupService';
import { UseNamespace } from '../../middleware/auth/UseNamespace';


@Controller("/customer/popup")
@Docs("docs_customer")
export class PopupController {
    constructor(
        private popupService: PopupService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @UseNamespace()
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0)
    })
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @QueryParams("search") search: string = "",
        @Req() req: Request,
        @Res() res: Response
    ) {
        const storeId = req.store.id
        const { popups, total } = await this.popupService.getManyAndCount({
            limit,
            search,
            page,
            storeId,
            isVisible: true,
        })
        return res.sendOK({ popups, total });
    }

    @Get('/:popupId')
    @UseNamespace()
    @Validator({
        popupId: Joi.required()
    })
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('popupId') popupId: number
    ) {
        const storeId = req.store.id
        const popup = await this.popupService.getOne(popupId, storeId);
        return res.sendOK(popup)
    }

} // END FILE
