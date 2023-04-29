// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import { Enum, Summary } from '@tsed/schema';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { CouponCampaign, CouponCampaignType, CouponConditionType } from '../../entity/CouponCampaign';
import { CouponCampaignService } from '../../services/CouponCampaignService';
import { CouponCampaignDetailInsert } from '../../entity-request/CouponCampaignDetailInsert';
import { CouponCampaignDetail } from '../../entity/CouponCampaignDetail';
import { getCurrentTimeInt } from '../../util/helper';
import { BadRequest } from '@tsed/exceptions';
import { escape } from 'mysql2';
import { DeliveryType, Product } from '../../entity/Product';
import { Store } from '../../entity/Store';

@Controller("/admin/couponCampaign")
@Docs("docs_admin")
export class CouponCampaignController {
    constructor(
        private couponCampaignService: CouponCampaignService
    ) { }


    @Post('/init')
    @UseAuth(VerificationJWT)
    async init(
        @HeaderParams("token") token: string,
        @BodyParams('storeId') storeId: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const store = await Store.findOneOrThrowId(storeId, null, '')
        await this.couponCampaignService.init(store);

        return res.sendOK({})
    }


} // END FILE
