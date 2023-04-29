// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import { Summary } from '@tsed/schema';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Product } from '../../entity/Product';
import { ProductService } from '../../services/ProductService';
import { UseAuthHash } from '../../middleware/auth/UseAuthHash';
import { ProductCustomFieldInsert } from '../../entity-request/ProductCustomFieldInsert';
import { PromotionCampaignDetail } from '../../entity/PromotionCampaignDetail';
import { FlashSaleCampaignDetail } from '../../entity/FlashSaleCampaignDetail';
import { escape } from 'mysql2';
import { PromotionDiscountType } from '../../entity/PromotionCampaign';

@Controller("/store/product")
@Docs("docs_store")
export class ProductController {
    constructor(
        private productService: ProductService
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
        @QueryParams('productCategoryId') productCategoryId: number,
        @QueryParams('depotId') depotId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { products, total } = await this.productService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id,
            productCategoryId,
            depotId
        });

        return res.sendOK({ products, total });
    }


    @Get('/raw')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100)
    })
    async getRaw(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams("search") search: string = "",
        @QueryParams('productCategoryId') productCategoryId: number,
        @QueryParams('depotId') depotId: number,
        @QueryParams('queryObject') queryObject: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { products, total } = await this.productService.getRawMany({
            limit,
            search,
            page,
            storeId: req.store.id,
            productCategoryId,
            queryObject,
            depotId
        });

        return res.sendOK({ products, total });
    }


    @Get('/promotion/available')
    @UseAuth(VerificationJWT)
    @Summary('Get ds product hợp lệ để khuyến mãi')
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(1).max(100),
        startAt: Joi.number().required(),
        endAt: Joi.number().required()
    })
    async getProductValidToPromotion(
        @HeaderParams("token") token: string,
        @QueryParams('page') page: number = 1,
        @QueryParams('limit') limit: number = 10,
        @QueryParams('search') search: string = '',
        @QueryParams('startAt') startAt: number,
        @QueryParams('productCategoryId') productCategoryId: number,
        @QueryParams('endAt') endAt: number,
        @QueryParams('ignoreIds', Number) ignoreIds: number[],
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const storeId = req.store.id;

        let where = `product.isDeleted = 0 AND CONCAT(product.code, ' ', product.name, ' ', product.nameEn) LIKE :search AND store.id = :storeId`;

        if (productCategoryId) {
            where += ` AND productCategory.id = :productCategoryId`
        }

        const subPromotionQuery = PromotionCampaignDetail.createQueryBuilder('promotionCampaignDetail')
            .select('product.id', 'productId')
            .innerJoin('promotionCampaignDetail.product', 'product')
            .innerJoin('promotionCampaignDetail.promotionCampaign', 'promotionCampaign')
            .leftJoin('promotionCampaign.store', 'store')
            .where(`(${startAt} BETWEEN promotionCampaign.startAt AND promotionCampaign.endAt OR ${endAt} BETWEEN promotionCampaign.startAt AND promotionCampaign.endAt OR (${startAt} <= promotionCampaign.startAt AND ${endAt} >= promotionCampaign.endAt)) AND promotionCampaign.isDeleted = 0 AND promotionCampaign.discountType = ${escape(PromotionDiscountType.Percent)} AND store.id = ${storeId}`)

        const subFlashSaleQuery = FlashSaleCampaignDetail.createQueryBuilder('flashSaleCampaignDetail')
            .select('product.id', 'productId')
            .innerJoin('flashSaleCampaignDetail.product', 'product')
            .innerJoin('flashSaleCampaignDetail.flashSaleCampaign', 'flashSaleCampaign')
            .leftJoin('flashSaleCampaign.store', 'store')
            .where(`(${startAt} BETWEEN flashSaleCampaign.startAt AND flashSaleCampaign.endAt OR ${endAt} BETWEEN flashSaleCampaign.startAt AND flashSaleCampaign.endAt OR (${startAt} <= flashSaleCampaign.startAt AND ${endAt} >= flashSaleCampaign.endAt)) AND flashSaleCampaign.isDeleted = 0 AND store.id = ${storeId}`)

        where += ` AND product.id NOT IN (${subPromotionQuery.getQuery()})`

        where += ` AND product.id NOT IN (${subFlashSaleQuery.getQuery()})`


        if (ignoreIds?.length) {
            where += ` AND product.id NOT IN (:...ignoreIds)`
        }


        const [products, total] = await Product.createQueryBuilder('product')
            .leftJoinAndSelect('product.productCategory', 'productCategory')
            .leftJoin('product.store', 'store')
            .where(where, { search: `%${search}%`, productCategoryId, storeId, ignoreIds })
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
    @UseAuthHash()
    @Validator({
        product: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("product") product: Product,
        @BodyParams('images', String) images: string[],
        @BodyParams('productCategoryId') productCategoryId: number,
        @BodyParams('productTaxId') productTaxId: number,
        @BodyParams('productCustomFields', ProductCustomFieldInsert) productCustomFields: ProductCustomFieldInsert[],
        @BodyParams('depotId') depotId: number,
        @BodyParams('inventoryNote') inventoryNote: string,
        @BodyParams('transportIds', Number) transportIds: number[]
    ) {
        await this.productService.createOrUpdate({
            product,
            images,
            storeId: req.store.id,
            productCategoryId,
            productCustomFields,
            productTaxId,
            depotId,
            inventoryNote,
            employee: req.employee,
            transportIds
        })

        return res.sendOK(product)
    }

    // =====================UPDATE ITEM=====================
    @Patch('/:productId')
    @UseAuth(VerificationJWT)
    @Validator({
        product: Joi.required(),
        productId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("product") product: Product,
        @PathParams("productId") productId: number,
        @BodyParams('images', String) images: string[],
        @BodyParams('productCategoryId') productCategoryId: number,
        @BodyParams('productTaxId') productTaxId: number,
        @BodyParams('productCustomFields', ProductCustomFieldInsert) productCustomFields: ProductCustomFieldInsert[],
    ) {
        await Product.findOneOrThrowId(productId)

        product.id = productId;
        await this.productService.createOrUpdate({
            product,
            images,
            storeId: req.store.id,
            productCategoryId,
            productCustomFields,
            productId,
            productTaxId,
            employee: req.employee
        })

        return res.sendOK(product)
    }

    @Get('/:productId')
    @Validator({
        productId: Joi.required()
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('productId') productId: number
    ) {
        const product = await this.productService.getOne(productId)
        return res.sendOK(product)
    }


    // =====================UPDATE ITEM=====================
    @Delete('/:productId')
    @UseAuthHash()
    @UseAuth(VerificationJWT)
    @Validator({
        productId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("productId") productId: number,
    ) {
        const product = await Product.findOneOrThrowId(productId)
        product.deletedBy = req.employee
        await product.delete()

        return res.sendOK(product)
    }

} // END FILE
