// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { ProductRate } from '../../entity/ProductRate';
import { ProductRateService } from '../../services/ProductRateService';


@Controller("/admin/productRate")
@Docs("docs_admin")
export class ProductRateController {
    constructor(
        private productRateService: ProductRateService
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
        @QueryParams('productId') productId: number,
        @QueryParams('star') star: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { productRates, total } = await this.productRateService.getManyAndCount({
            limit,
            search,
            page,
            productId,
            star
        })
        return res.sendOK({ productRates, total });
    }


    // =====================UPDATE ITEM=====================
    @Delete('/:productRateId')
    @UseAuth(VerificationJWT)
    @Validator({
        productRateId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,

        @PathParams("productRateId") productRateId: number,
    ) {
        const productRate = await ProductRate.findOneOrThrowId(productRateId, {
            relations: ['product']
        })
        const { product } = productRate

        if (product.isDeleted) {
            return res.sendOK({})
        }

        productRate.isDeleted = true;
        await productRate.save();

        product.totalRate--;
        product.totalStar -= productRate.star;
        await product.save();

        return res.sendOK(productRate)
    }

} // END FILE
