// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import { Enum, Summary } from '@tsed/schema';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { PromotionCampaign, PromotionConditionType, PromotionDiscountType } from '../../entity/PromotionCampaign';
import { PromotionCampaignService } from '../../services/PromotionCampaignService';
import { PromotionCampaignDetailInsert } from '../../entity-request/PromotionCampaignDetailInsert';
import { PromotionCampaignDetail } from '../../entity/PromotionCampaignDetail';
import { getCurrentTimeInt } from '../../util/helper';
import { BadRequest } from '@tsed/exceptions';

@Controller("/store/promotionCampaign")
@Docs("docs_store")
export class PromotionCampaignController {
    constructor(
        private promotionCampaignService: PromotionCampaignService
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
        @QueryParams("dateType") dateType: 'coming' | 'current' | 'end', //current: đang diễn ra
        @QueryParams('storeId') storeId: number,
        @QueryParams('discountType') @Enum(PromotionDiscountType) discountType: PromotionDiscountType,
        @QueryParams('conditionType') @Enum(PromotionConditionType) conditionType: PromotionConditionType,
        @QueryParams('productIds', Number) productIds: number[],
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { promotionCampaigns, total } = await this.promotionCampaignService.getManyAndCount({
            limit,
            search,
            page,
            dateType,
            storeId: req.store.id,
            discountType,
            productIds,
            conditionType
        })

        return res.sendOK({ promotionCampaigns, total });
    }

    @Get('/:promotionCampaignId')
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
        const storeId = req.store.id
        const promotionCampaign = await this.promotionCampaignService.getOne(promotionCampaignId, storeId)
        return res.sendOK(promotionCampaign)
    }


    @Get('/summary/fixed')
    @UseAuth(VerificationJWT)
    @Summary('Summary promotion giảm tiền cứng trên đơn')
    async getSummaryFixed(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams('storeId') storeId: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const {
            promotions,
            total
        } = await this.promotionCampaignService.summaryDiscountFixed({
            page,
            limit,
            storeId: req.store.id
        })

        return res.sendOK({
            total,
            promotions
        })
    }

    @Get('/summary/gift')
    @UseAuth(VerificationJWT)
    @Summary('Summary promotion quà tặng kèm')
    async getSummaryGift(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams('storeId') storeId: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const {
            promotions,
            total
        } = await this.promotionCampaignService.summaryGiftPromotion({
            page,
            limit,
            storeId: req.store.id
        })

        return res.sendOK({
            total,
            promotions
        })
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        promotionCampaign: Joi.required()
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("promotionCampaign") promotionCampaign: PromotionCampaign,
        @BodyParams('promotionCampaignDetails', PromotionCampaignDetailInsert) details: PromotionCampaignDetailInsert[],
        @BodyParams('couponCampaignId') couponCampaignId: number,
    ) {
        let promotionCampaignDetails: PromotionCampaignDetail[] = []
        if (details && details.length) {
            promotionCampaignDetails = await Promise.all(details.map(e => e.toPromotionCampaignDetail()));
            await PromotionCampaignDetail.save(promotionCampaignDetails);
            promotionCampaign.promotionCampaignDetails = promotionCampaignDetails
        }

        if (couponCampaignId) await promotionCampaign.assignCouponCampaign(couponCampaignId);

        promotionCampaign.store = req.store;

        await this.promotionCampaignService.validate(promotionCampaign, promotionCampaignDetails, promotionCampaign.store)

        await promotionCampaign.save()
        return res.sendOK(promotionCampaign)
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:promotionCampaignId')
    @UseAuth(VerificationJWT)
    @Validator({
        promotionCampaign: Joi.required(),
        promotionCampaignId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("promotionCampaign") promotionCampaign: PromotionCampaign,
        @PathParams("promotionCampaignId") promotionCampaignId: number,
        @BodyParams('promotionCampaignDetails', PromotionCampaignDetailInsert) details: PromotionCampaignDetailInsert[],
        @BodyParams('couponCampaignId') couponCampaignId: number,
    ) {
        const oldPromotionCampaign = await PromotionCampaign.findOneOrThrowId(promotionCampaignId, {
            relations: ['store']
        });

        const current = getCurrentTimeInt()
        if (oldPromotionCampaign.endAt < current || (current >= oldPromotionCampaign.startAt && current <= oldPromotionCampaign.endAt)) {
            throw new BadRequest("Không thể sửa chiến khi đang diễn ra hoặc đã kết thúc");
        }
        let promotionCampaignDetails: PromotionCampaignDetail[] = []
        if (details && details.length) {
            promotionCampaignDetails = await Promise.all(details.map(e => e.toPromotionCampaignDetail()));
            await PromotionCampaignDetail.save(promotionCampaignDetails);
            promotionCampaign.promotionCampaignDetails = promotionCampaignDetails
        }

        if (couponCampaignId) await promotionCampaign.assignCouponCampaign(couponCampaignId)

        promotionCampaign.id = +promotionCampaignId;


        await this.promotionCampaignService.validate(promotionCampaign, promotionCampaignDetails, promotionCampaign.store || oldPromotionCampaign.store)

        await promotionCampaign.save()

        return res.sendOK(promotionCampaign)
    }

    @Patch('/:promotionCampaignId/end')
    @UseAuth(VerificationJWT)
    @Summary("Kết thúc chiến dịch sớm")
    @Validator({
        promotionCampaignId: Joi.number().required()
    })
    async updateEnd(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("promotionCampaignId") promotionCampaignId: number,
    ) {
        const promotionCampaign = await PromotionCampaign.findOneOrThrowId(promotionCampaignId)

        if (promotionCampaign.endAt < getCurrentTimeInt()) {
            throw new BadRequest("Chiến dịch đã kết thúc.");
        }

        promotionCampaign.endAt = getCurrentTimeInt();
        await promotionCampaign.save();

        return res.sendOK({})
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:promotionCampaignId')
    @UseAuth(VerificationJWT)
    @Validator({
        promotionCampaignId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("promotionCampaignId") promotionCampaignId: number,
    ) {
        const promotionCampaign = await PromotionCampaign.findOneOrThrowId(promotionCampaignId)

        const current = getCurrentTimeInt()
        if (promotionCampaign.endAt < current || (current >= promotionCampaign.startAt && current <= promotionCampaign.endAt)) {
            throw new BadRequest("Không thể sửa chiến khi đang diễn ra hoặc đã kết thúc");
        }

        promotionCampaign.deletedBy = req.employee;
        promotionCampaign.isDeleted = true
        await promotionCampaign.save()

        return res.sendOK(promotionCampaign)
    }

} // END FILE
