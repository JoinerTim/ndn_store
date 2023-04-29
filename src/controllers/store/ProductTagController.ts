// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { ProductTag } from '../../entity/ProductTag';
import { ProductTagService } from '../../services/ProductTagService';
import { Product } from '../../entity/Product';
import { BadRequest } from '@tsed/exceptions';

@Controller("/store/productTag")
@Docs("docs_store")
export class ProductTagController {
    constructor(
        private productTagService: ProductTagService
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
        const { productTags, total } = await this.productTagService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id
        })

        return res.sendOK({ productTags, total });
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        productTag: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("productTag") productTag: ProductTag,
    ) {
        productTag.name = productTag.name.trim()
        productTag.store = req.store;
        await productTag.save()
        return res.sendOK(productTag)
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:productTagId')
    @UseAuth(VerificationJWT)
    @Validator({
        productTag: Joi.required(),
        productTagId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("productTag") productTag: ProductTag,
        @PathParams("productTagId") productTagId: number,
    ) {
        await ProductTag.findOneOrThrowId(productTagId, {
            where: {
                store: req.store
            }
        })
        productTag.name = productTag.name.trim()
        productTag.id = +productTagId
        await productTag.save()

        return res.sendOK(productTag)
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:productTagId')
    @UseAuth(VerificationJWT)
    @Validator({
        productTagId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("productTagId") productTagId: number,
    ) {
        const productTag = await ProductTag.findOneOrThrowId(productTagId, {
            where: {
                store: req.store
            }
        })

        const product = await Product.createQueryBuilder('product')
            .innerJoin('product.productTags', 'productTag')
            .getOne()

        if (product) {
            throw new BadRequest(`Sản phẩm '${product.name}' đang dùng từ khóa này, không thể xóa`);

        }

        productTag.isDeleted = true;
        await productTag.save()

        return res.sendOK(productTag)
    }

} // END FILE
