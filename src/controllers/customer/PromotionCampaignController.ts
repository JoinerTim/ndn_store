// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Enum } from '@tsed/schema';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { PromotionCampaign, PromotionConditionType, PromotionDiscountType } from '../../entity/PromotionCampaign';
import { PromotionCampaignService } from '../../services/PromotionCampaignService';
import { UseAuthHash } from '../../middleware/auth/UseAuthHash';
import { UseNamespace } from '../../middleware/auth/UseNamespace';

@Controller("/customer/promotionCampaign")
@Docs("docs_customer")
export class PromotionCampaignController {
    constructor(
        private promotionCampaignService: PromotionCampaignService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @UseAuthHash()
    @UseNamespace()
    @Validator({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100)
    })
    async findAll(
        @HeaderParams("token") token: string,
        @HeaderParams("is-dev") isDev: boolean,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams("search") search: string = "",
        @QueryParams('discountTypes') @Enum(PromotionDiscountType) discountTypes: PromotionDiscountType[],
        @QueryParams('conditionType') @Enum(PromotionConditionType) conditionType: PromotionConditionType,
        @QueryParams('productIds', Number) productIds: number[],
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { promotionCampaigns, total } = await this.promotionCampaignService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id,
            dateType: 'current',
            discountTypes,
            productIds,
            conditionType,
        })

        return res.sendOK({ promotionCampaigns, total });
    }


    @Get('/:promotionCampaignId/products')
    @UseAuth(VerificationJWT)
    @Validator({
        promotionCampaignId: Joi.required()
    })
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('promotionCampaignId') promotionCampaignId: number
    ) {
        const products = await this.promotionCampaignService.getOne(promotionCampaignId)
        return res.sendOK(products)
    }

} // END FILE
