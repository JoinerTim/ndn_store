// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Ward } from '../../entity/Ward';

@Controller("/store/ward")
@Docs("docs_store")
export class WardController {
    constructor(
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @Validator({
        parentCode: Joi.required()
    })
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams('parentCode') parentCode: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `ward.isDeleted = false AND ward.parentCode = :parentCode`
        const [wards, total] = await Ward.createQueryBuilder('ward')
            .where(where, { parentCode })
            .orderBy('ward.nameWithType', 'DESC')
            .getManyAndCount()


        return res.sendOK({ wards, total });
    }

} // END FILE
