// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { ProductCategory } from '../../entity/ProductCategory';
import { ProductCategoryService } from '../../services/ProductCategoryService';

@Controller("/store/productCategory")
@Docs("docs_store")
export class ProductCategoryController {
    constructor(
        private productCategoryService: ProductCategoryService
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
        const { productCategories, total } = await this.productCategoryService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id
        })

        return res.sendOK({ productCategories, total });
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        productCategory: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("productCategory") productCategory: ProductCategory,
    ) {
        productCategory.store = req.store;
        await productCategory.save()
        return res.sendOK(productCategory)
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:productCategoryId')
    @UseAuth(VerificationJWT)
    @Validator({
        productCategory: Joi.required(),
        productCategoryId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("productCategory") productCategory: ProductCategory,
        @PathParams("productCategoryId") productCategoryId: number,
    ) {
        await ProductCategory.findOneOrThrowId(productCategoryId, {
            where: {
                store: req.store
            }
        })
        productCategory.id = +productCategoryId
        await productCategory.save()

        return res.sendOK(productCategory)
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:productCategoryId')
    @UseAuth(VerificationJWT)
    @Validator({
        productCategoryId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("productCategoryId") productCategoryId: number,
    ) {
        const productCategory = await ProductCategory.findOneOrThrowId(productCategoryId, {
            where: {
                store: req.store
            }
        });
        await productCategory.delete()

        return res.sendOK(productCategory)
    }

} // END FILE
