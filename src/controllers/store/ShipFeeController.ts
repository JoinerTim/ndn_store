// IMPORT LIBRARY
import { Controller, UseAuth, Req, Res, Response, HeaderParams, BodyParams, Post } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Summary } from '@tsed/schema';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { ShipFeeService } from '../../services/ShipFeeService';
import { City } from '../../entity/City';
import { District } from '../../entity/District';
import { Store } from '../../entity/Store';

@Controller("/store/shipFee")
@Docs("docs_store")
export class ShipFeeController {
    constructor(
        private shipFeeService: ShipFeeService
    ) { }


    @Post('')
    @UseAuth(VerificationJWT)
    @Summary("Create or update")
    @Validator({
        price: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("price") price: number,
        @BodyParams("cityId") cityId: number,
        @BodyParams('districtId') districtId: number,
    ) {
        const city = await City.findOne(cityId)
        const district = districtId ? await District.findOne(districtId) : undefined
        const store = req.store;

        const shipFee = await this.shipFeeService.createOrUpdate({
            price,
            city,
            district,
            store
        })

        return res.sendOK(shipFee)
    }

} // END FILE
