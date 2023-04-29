// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Patch, Delete } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { News } from '../../entity/News';
import { NewsService } from '../../services/NewsService';
import { ProductTax } from '../../entity/ProductTax';
import { ProductTaxService } from '../../services/ProductTaxService';
import { BadRequest } from '@tsed/exceptions';


@Controller("/store/productTax")
@Docs("docs_store")
export class ProductTaxController {

    constructor(
        private productTaxService: ProductTaxService
    ) { }


    @Get('/:productTaxId')
    @UseAuth(VerificationJWT)
    @Validator({
        productTaxId: Joi.required()
    })
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('productTaxId') productTaxId: number
    ) {
        const productTax = await ProductTax.findOneOrThrowId(productTaxId)
        return res.sendOK(productTax)
    }

    @Get('/')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0)
    })
    async findAll(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @QueryParams("search") search: string = "",
    ) {
        const { productTaxs, total } = await this.productTaxService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id
        })
        return res.sendOK({ productTaxs, total });
    }

    @Post('/')
    @UseAuth(VerificationJWT)
    @Validator({
        productTax: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("productTax") productTax: ProductTax,
    ) {
        const store = req.store
        productTax.store = store
        await productTax.save();

        return res.sendOK(productTax)
    }


    @Patch('/:productTaxId')
    @UseAuth(VerificationJWT)
    @Validator({
        productTax: Joi.required(),
        productTaxId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("productTax") productTax: ProductTax,
        @PathParams("productTaxId") productTaxId: number,
    ) {

        const productTaxFound = await ProductTax.createQueryBuilder('productTax')
            .leftJoinAndSelect('productTax.store', 'store')
            .where('productTax.id = :productTaxId AND store.id = :storeId', { productTaxId, storeId: req.store.id })
            .getOne()

        if (!productTaxFound) {
            throw new BadRequest('Thuế sản phẩm không tồn tại.')
        }

        await ProductTax.findOneOrThrowId(productTaxId)
        productTax.id = +productTaxId;

        await productTax.save()

        return res.sendOK(productTax)
    }

    @Delete('/:productTaxId')
    @UseAuth(VerificationJWT)
    @Validator({
        productTaxId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("productTaxId") productTaxId: number,
    ) {
        const productTax = await ProductTax.createQueryBuilder('productTax')
            .leftJoinAndSelect('productTax.store', 'store')
            .where('productTax.id = :productTaxId AND store.id = :storeId', { productTaxId, storeId: req.store.id })
            .getOne()

        if (!productTax) {
            throw new BadRequest('Thuế sản phẩm không tồn tại.')
        }

        productTax.isDeleted = true

        await productTax.save()

        return res.sendOK(productTax)
    }

} // END FILE
