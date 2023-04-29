// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams, Patch, BodyParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { City } from '../../entity/City';

@Controller("/admin/city")
@Docs("docs_admin")
export class CityController {
    constructor(
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
        @QueryParams('storeId') storeId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `city.name LIKE :search AND city.isDeleted = false`;

        const query = City.createQueryBuilder('city')
            .where(where, { search: `%${search}%` })

        if (storeId) {
            query.leftJoinAndSelect('city.shipFees', 'shipFee', 'shipFee.storeId = :storeId', { storeId })
        }

        const [cities, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('city.id', 'DESC')
            .getManyAndCount()


        return res.sendOK({ cities, total });
    }
} // END FILE
