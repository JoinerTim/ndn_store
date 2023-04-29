// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { ProductRate } from '../../entity/ProductRate';
import { ProductRateService } from '../../services/ProductRateService';


@Controller("/store/productRate")
@Docs("docs_store")
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
            star,
            storeId: req.store.id
        })
        return res.sendOK({ productRates, total });
    }

    @Get('/summary/total')
    @UseAuth(VerificationJWT)
    async getSummaryTotal(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const storeId = req.store.id
        let where = `productRate.isDeleted  = false `;

        const productRate = await ProductRate.createQueryBuilder('productRate')
            .select('productRate.star ', 'star')
            .addSelect('COUNT(*)', 'total')
            .leftJoin('productRate.product', 'product')
            .leftJoin('product.store', 'store')
            .groupBy('productRate.star ')
            .where(where + ` AND store.id = :storeId`, { storeId })
            .getRawMany()

        return res.sendOK(productRate)
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
        let where = 'store.id = :storeId '
        if (productRateId) {
            where += ` AND productRate.id = :productRateId`
        }
        const productRate = await ProductRate.createQueryBuilder("productRate")
            .leftJoinAndSelect("productRate.product", "product")
            .leftJoin("product.store", "store")
            .where(where, { storeId: req.store.id, productRateId })
            .getOne()

        const product = productRate.product

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
