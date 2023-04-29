// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import { Enum, Summary } from '@tsed/schema';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { CouponApplyFor, CouponCampaign, CouponCampaignType, CouponConditionType } from '../../entity/CouponCampaign';
import { CouponCampaignService } from '../../services/CouponCampaignService';
import { CouponCampaignDetailInsert } from '../../entity-request/CouponCampaignDetailInsert';
import { CouponCampaignDetail } from '../../entity/CouponCampaignDetail';
import { getCurrentTimeInt } from '../../util/helper';
import { BadRequest } from '@tsed/exceptions';
import { escape } from 'mysql2';
import { DeliveryType, Product } from '../../entity/Product';
import { Customer } from '../../entity/Customer';
import { CustomerCoupon } from '../../entity/CustomerCoupon';
import moment from 'moment';

@Controller("/store/couponCampaign")
@Docs("docs_store")
export class CouponCampaignController {
    constructor(
        private couponCampaignService: CouponCampaignService
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
        @QueryParams('type') @Enum(CouponCampaignType) type: CouponCampaignType,
        @QueryParams("dateType") dateType: 'coming' | 'current' | 'end', //current: đang diễn ra
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { couponCampaigns, total } = await this.couponCampaignService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id,
            dateType,
            type
        })

        return res.sendOK({ couponCampaigns, total });
    }

    @Get('/promotion/available')
    @UseAuth(VerificationJWT)
    @Validator({
        startAt: Joi.required(),
        endAt: Joi.required()
    })
    @Summary("Lấy ds hợp lệ")
    async getAvailableForPromotion(
        @HeaderParams("token") token: string,
        @QueryParams('page') page: number = 1,
        @QueryParams('limit') limit: number = 10,
        @QueryParams('startAt') startAt: number,
        @QueryParams('endAt') endAt: number,
        @QueryParams('ignoreIds', Number) ignoreIds: number[],
        @QueryParams('productCategoryId') productCategoryId: number,
        @QueryParams('search') search: string = '',
        @Req() req: Request,
        @Res() res: Response,
    ) {
        let where = `store.id = :storeId`

        where += ` AND product.isDeleted = 0 AND CONCAT(product.code, ' ', product.name, ' ', product.nameEn) LIKE :search AND product.deliveryType = ${escape(DeliveryType.FromStore)}`;

        const subQuery = CouponCampaign.createQueryBuilder('couponCampaign')
            .select('product.id', 'productId')
            .innerJoin('couponCampaign.couponCampaignDetails', 'couponCampaignDetail')
            .innerJoin('couponCampaignDetail.product', 'product')
            .where(`(${startAt} BETWEEN couponCampaign.startAt AND couponCampaign.endAt OR ${endAt} BETWEEN couponCampaign.startAt AND couponCampaign.endAt OR (${startAt} <= couponCampaign.startAt AND ${endAt} >= couponCampaign.endAt)) AND couponCampaign.isDeleted = 0 AND couponCampaign.conditionType = ${escape(CouponConditionType.SomeProduct)}`)

        where += ` AND product.id NOT IN (${subQuery.getQuery()})`

        if (ignoreIds?.length) {
            where += ` AND product.id NOT IN (:...ignoreIds)`
        }


        const [products, total] = await Product.createQueryBuilder('product')
            .leftJoinAndSelect('product.productCategory', 'productCategory')
            .leftJoin('product.store', 'store')
            .where(where, { search: `%${search}%`, productCategoryId, ignoreIds, storeId: req.store.id })
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount()


        return res.sendOK({
            products,
            total
        })
    }

    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        couponCampaign: Joi.required(),
        couponCampaignDetails: Joi.required()
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("couponCampaign") couponCampaign: CouponCampaign,
        @BodyParams('couponCampaignDetails', CouponCampaignDetailInsert) details: CouponCampaignDetailInsert[],
        @BodyParams('customerIds', Number) customerIds: number[]

    ) {
        const data = await this.couponCampaignService.createOrUpdate({ couponCampaign, details, customerIds, store: req.store })

        return res.sendOK(data)
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:couponCampaignId')
    @UseAuth(VerificationJWT)
    @Validator({
        couponCampaign: Joi.required(),
        couponCampaignId: Joi.number().required(),
        couponCampaignDetails: Joi.required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("couponCampaign") couponCampaign: CouponCampaign,
        @BodyParams('couponCampaignDetails', CouponCampaignDetailInsert) details: CouponCampaignDetailInsert[],
        @PathParams("couponCampaignId") couponCampaignId: number,
        @BodyParams('customerIds', Number) customerIds: number[]
    ) {
        const data = await this.couponCampaignService.createOrUpdate({ couponCampaign, details, customerIds, store: req.store, couponCampaignId })

        return res.sendOK(data)
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:couponCampaignId')
    @UseAuth(VerificationJWT)
    @Validator({
        couponCampaignId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("couponCampaignId") couponCampaignId: number,
    ) {
        const couponCampaign = await CouponCampaign.findOneOrThrowId(couponCampaignId, {
            where: {
                store: req.store
            }
        });

        if (couponCampaign.endAt <= getCurrentTimeInt()) {
            throw new BadRequest("Không thể xóa chiến khi đang diễn ra hoặc đã kết thúc");
        }

        couponCampaign.isDeleted = true;
        await couponCampaign.save()

        return res.sendOK(couponCampaign)
    }

} // END FILE
