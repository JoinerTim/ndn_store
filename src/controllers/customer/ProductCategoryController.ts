// IMPORT LIBRARY
import { Controller, Req, Get, Res, Response, HeaderParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Enum } from '@tsed/schema';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { ProductCategory, ProductCategoryType } from '../../entity/ProductCategory';
import { ProductCategoryService } from '../../services/ProductCategoryService';
import { ProductService } from '../../services/ProductService';
import { CustomerService } from '../../services/CustomerService';
import { UseAuthHash } from '../../middleware/auth/UseAuthHash';
import { LangCode } from '../../types/language';
import { UseNamespace } from '../../middleware/auth/UseNamespace';


@Controller("/customer/productCategory")
@Docs("docs_customer")
export class ProductCategoryController {
    constructor(
        private productCategoryService: ProductCategoryService,
        private productService: ProductService,
        private customerService: CustomerService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0),
    })
    @UseNamespace()
    @UseAuthHash()
    async findAll(
        @HeaderParams("token") token: string,
        @HeaderParams("is-dev") isDev: boolean,
        @HeaderParams("lang") lang: LangCode = LangCode.Vi,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @QueryParams("search") search: string = "",
        @QueryParams('level') level: number,
        @QueryParams('parentId') parentId: number,
        @QueryParams('type') @Enum(ProductCategoryType) type: ProductCategoryType,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { productCategories, total } = await this.productCategoryService.getManyAndCount({
            limit,
            search,
            page,
            level,
            parentId,
            type,
            isVisible: true,
            lang,
            storeId: req.store.id
        })
        return res.sendOK({ productCategories, total });
    }

    @Get('/highlight')
    @UseNamespace()
    async getHighlight(
        @HeaderParams("token") token: string,
        @HeaderParams("lang") lang: LangCode = LangCode.Vi,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        if (token) {
            req.customer = await this.customerService.getInfoByJwt(token)
        }
        const storeId = req.store.id

        let where = `productCategory.isHighlight = 1 AND store.id = :storeId AND productCategory.isDeleted = 0 AND productCategory.isVisible = 1`

        const productCategories = await ProductCategory.createQueryBuilder('productCategory')
            .leftJoin('productCategory.store', 'store')
            .where(where, {
                storeId
            })
            .orderBy('productCategory.position', 'ASC')
            .getMany();

        for (const productCategory of productCategories) {
            switch (lang) {
                case LangCode.Eng:
                    productCategory.name = productCategory.nameEn || productCategory.name;
                    break;

                default:
                    break;
            }

            const { products } = await this.productService.getManyAndCount({
                page: 1,
                limit: 4,
                productCategoryId: productCategory.id,
                isActive: true,
                storeId,
                customerId: req.customer?.id,
                lang
            })

            await this.productService.mapPromotion(products, storeId)
            this.productService.mapFlashSale(products)

            productCategory.products = products;
        }

        return res.sendOK({ productCategories });
    }

    @Get('/trees')
    async findTrees(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const trees = await ProductCategory.getTreeRepository().findTrees({})
        res.sendOK(trees)
    }



} // END FILE
