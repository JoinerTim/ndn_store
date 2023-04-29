// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Patch, Delete } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Popup } from '../../entity/Popup';
import { PopupService } from '../../services/PopupService';


@Controller("/admin/popup")
@Docs("docs_admin")
export class PopupController {
    constructor(
        private popupService: PopupService
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
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { popups, total } = await this.popupService.getManyAndCount({
            limit,
            search,
            page,
        })
        return res.sendOK({ popups, total });
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        popup: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("popup") popup: Popup,
        @BodyParams('areaId') areaId: number,
        @BodyParams('productId') productId: number,
    ) {
        if (productId) await popup.assignProduct(productId)

        await popup.save()
        return res.sendOK(popup)
    }


    @Patch('/:popupId/show')
    @UseAuth(VerificationJWT)
    @Validator({
        popupId: Joi.number().required()
    })
    async show(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("popupId") popupId: number,
    ) {
        const popup = await Popup.findOneOrThrowId(popupId, null, '')
        popup.isVisible = true;

        await popup.save();

        res.sendOK(popup)
    }

    @Patch('/:popupId/hide')
    @UseAuth(VerificationJWT)
    @Validator({
        popupId: Joi.number().required()
    })
    async hide(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("popupId") popupId: number,
    ) {
        const popup = await Popup.findOneOrThrowId(popupId, null, '')
        popup.isVisible = false;

        await popup.save();

        res.sendOK(popup)
    }

    // =====================UPDATE ITEM=====================
    @Patch('/:popupId')
    @UseAuth(VerificationJWT)
    @Validator({
        popup: Joi.required(),
        popupId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("popup") popup: Popup,
        @PathParams("popupId") popupId: number,
        @BodyParams('productId') productId: number,
    ) {
        await Popup.findOneOrThrowId(popupId)
        popup.id = +popupId;

        if (productId) {
            await popup.assignProduct(productId)
        } else if (productId == 0) {
            popup.product = null;
        }

        await popup.save()

        return res.sendOK(popup)
    }

    @Delete('/:popupId')
    @UseAuth(VerificationJWT)
    @Validator({
        popupId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("popupId") popupId: number,
    ) {
        const popup = await Popup.findOneOrThrowId(popupId)
        popup.isDeleted = true

        await popup.save()

        return res.sendOK(popup)
    }

} // END FILE
