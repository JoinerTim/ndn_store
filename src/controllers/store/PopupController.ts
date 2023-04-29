// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Patch, Delete, MultipartFile } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { ValidateFile, Validator } from '../../middleware/validator/Validator';
import { News } from '../../entity/News';
import { NewsService } from '../../services/NewsService';
import { ProductTax } from '../../entity/ProductTax';
import { ProductTaxService } from '../../services/ProductTaxService';
import { BadRequest } from '@tsed/exceptions';
import { PopupService } from '../../services/PopupService';
import { Popup } from '../../entity/Popup';

import fse from "fs-extra";
import path from 'path';
import CONFIG from '../../../config';
import { ImageUtil } from '../../util/image';


@Controller("/store/popup")
@Docs("docs_store")
export class PopupController {

    constructor(
        private popupService: PopupService
    ) { }


    @Get('/')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0)
    })
    async getAll(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @QueryParams("search") search: string = "",
        @QueryParams("isVisible") isVisible: boolean,
    ) {
        const storeId = req.store.id
        const { popups, total } = await this.popupService.getManyAndCount({ page, limit, search, isVisible, storeId })
        return res.sendOK({ popups, total })
    }

    @Get('/:popupId')
    @UseAuth(VerificationJWT)
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
        const popup = await this.popupService.getOne(popupId, storeId)
        return res.sendOK(popup)
    }

    @Post('/')
    @UseAuth(VerificationJWT)
    @Validator({
        popup: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("popup") popup: Popup,
        @BodyParams('productId') productId: number
    ) {

        if (productId) {
            await popup.assignProduct(productId)
        }

        popup.store = req.store
        await popup.save();

        return res.sendOK(popup)
    }


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
        @BodyParams('productId') productId: number

    ) {
        const storeId = req.store.id

        const popupFound = await Popup.createQueryBuilder('popup')
            .leftJoinAndSelect('popup.store', 'store')
            .where('store.id = :storeId AND popup.id = :popupId', { storeId, popupId })
            .getOne()

        if (!popupFound) {
            throw new BadRequest("Không tìm thấy Pop up.")
        }

        if (productId) {
            await popupFound.assignProduct(productId)
        }

        popup.id = +popupId;

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

        const storeId = req.store.id

        const popupFound = await Popup.createQueryBuilder('popup')
            .leftJoinAndSelect('popup.store', 'store')
            .where('store.id = :storeId AND popup.id = :popupId', { storeId, popupId })
            .getOne()

        if (!popupFound) {
            throw new BadRequest("Không tìm thấy Pop up.")
        }

        popupFound.isDeleted = true

        await popupFound.save()

        return res.sendOK(popupFound)
    }

    @Post('/upload')
    @UseAuth(VerificationJWT)
    @ValidateFile()
    uploadFile(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @MultipartFile('file') file: Express.Multer.File,
    ) {

        file.path = file.path.replace(CONFIG.UPLOAD_DIR, '');
        return res.sendOK(file)
    }

} // END FILE
