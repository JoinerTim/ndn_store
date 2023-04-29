// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams, BodyParams, Patch } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { District } from '../../entity/District';

@Controller("/admin/district")
@Docs("docs_admin")
export class DistrictController {
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
        @QueryParams('storeId') storeId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `district.isDeleted = false AND district.parentCode = :parentCode`

        const query = District.createQueryBuilder('district')
            .where(where, { parentCode })

        if (storeId) {
            query.leftJoinAndSelect('district.shipFees', 'shipFee', 'shipFee.storeId = :storeId', { storeId })
        }

        const [districts, total] = await query
            .orderBy('district.nameWithType', 'DESC')
            .getManyAndCount()
        return res.sendOK({ districts, total });
    }



} // END FILE
