// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { CustomField } from '../../entity/CustomField';
import { CustomFieldService } from '../../services/CustomFieldService';

@Controller("/store/customField")
@Docs("docs_store")
export class CustomFieldController {
    constructor(
        private customFieldService: CustomFieldService
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
        const { customFields, total } = await this.customFieldService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id
        })

        return res.sendOK({ customFields, total });
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        customField: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("customField") customField: CustomField,
    ) {
        await this.customFieldService.createOrUpdate(customField, req.store, null)

        return res.sendOK(customField)
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:customFieldId')
    @UseAuth(VerificationJWT)
    @Validator({
        customField: Joi.required(),
        customFieldId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("customField") customField: CustomField,
        @PathParams("customFieldId") customFieldId: number,
    ) {
        await this.customFieldService.createOrUpdate(customField, req.store, customFieldId)

        return res.sendOK(customField)
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:customFieldId')
    @UseAuth(VerificationJWT)
    @Validator({
        customFieldId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("customFieldId") customFieldId: number,
    ) {
        const customField = await CustomField.findOneOrThrowId(customFieldId)
        customField.deletedBy = req.employee
        await customField.delete()

        return res.sendOK(customField)
    }

} // END FILE
