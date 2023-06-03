// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Patch, Delete } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { ProductService } from '../../services/ProductService';
import { ProductCategory, ProductCategoryType } from '../../entity/ProductCategory';
import { Product } from '../../entity/Product';
import { CustomerService } from '../../services/CustomerService';
import { LikedProduct } from '../../entity/LikedProduct';
import { ViewedProduct } from '../../entity/ViewedProduct';
import { Store } from '../../entity/Store';
import { UseAuthHash } from '../../middleware/auth/UseAuthHash';
import { LangCode } from '../../types/language';
import { UseNamespace } from '../../middleware/auth/UseNamespace';


@Controller("/customer/product")
@Docs("docs_customer")
export class ProductController {
    constructor(
        private productService: ProductService,
        private customerService: CustomerService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @Validator({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100),
        star: Joi.number().min(1).max(5)
    })
    @UseNamespace()
    @UseAuthHash()
    async findAll(
        @HeaderParams("token") token: string,
        @HeaderParams("lang") lang: LangCode,
        @HeaderParams("is-dev") isDev: boolean,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams("search") search: string = "",
        @QueryParams('queryObject') queryObject: string,
        @QueryParams('star') star: number, //tìm theo số sao
        @QueryParams('productCategoryId') productCategoryId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const storeId = req.store.id;
        if (token) {
            req.customer = await this.customerService.getInfoByJwt(token)
        }

        const { products, total } = await this.productService.getManyAndCount({
            limit,
            search,
            page,
            queryObject,
            customerId: req.customer?.id,
            star,
            isActive: true,
            productCategoryId,
            storeId,
            lang
        })

        await this.productService.mapPromotion(products, storeId)
        await this.productService.mapFlashSale(products)

        return res.sendOK({ products, total });
    }

    @Get('/liked')
    @UseAuth(VerificationJWT)
    @UseNamespace()
    @Validator({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100),
    })
    async findAlLiked(
        @HeaderParams("token") token: string,
        @HeaderParams("lang") lang: LangCode,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const storeId = req.store.id;
        const { products, total } = await this.productService.getManyAndCount({
            limit,
            search: '',
            page,
            customerId: req.customer.id,
            onlyLiked: true,
            isActive: true,
            storeId,
            lang
        })

        await this.productService.mapPromotion(products, storeId)
        this.productService.mapFlashSale(products)

        return res.sendOK({ products, total });
    }

    @Get('/viewed')
    @UseAuth(VerificationJWT)
    @UseNamespace()
    @Validator({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100),
    })
    async findAlViewed(
        @HeaderParams("token") token: string,
        @HeaderParams("lang") lang: LangCode,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const storeId = req.store.id;

        const { products, total } = await this.productService.getManyAndCount({
            limit,
            search: '',
            page,
            customerId: req.customer.id,
            isActive: true,
            storeId,
            onlyViewed: true,
            lang
        })

        await this.productService.mapPromotion(products, storeId)
        this.productService.mapFlashSale(products)

        return res.sendOK({ products, total });
    }

    @Get('/:productId')
    @Validator({
        productId: Joi.required()
    })
    @UseAuthHash()
    async findOne(
        @HeaderParams("token") token: string,
        @HeaderParams("lang") lang: LangCode,
        @HeaderParams("is-dev") isDev: boolean,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('productId') productId: number,
        @QueryParams('storeId') storeId: number,
    ) {
        if (token) {
            req.customer = await this.customerService.getInfoByJwt(token)
        }

        const product = await this.productService.getOne(productId, req.customer?.id, storeId, lang);

        if (!product) {
            return res.sendAPI({}, 'Not found', false, 200);
        }

        await this.productService.mapPromotion([product], storeId)
        await this.productService.mapFlashSale([product])

        return res.sendOK(product)
    }

    @Post('/:productId/view')
    @UseAuth(VerificationJWT)
    @Validator({
        productId: Joi.required(),
    })
    async viewProduct(
        @HeaderParams("token") token: string,
        @PathParams('productId') productId: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const product = await Product.findOneOrThrowId(productId, null, '')

        let viewedProduct = await ViewedProduct.findOne({
            where: {
                customer: req.customer,
                product,
            }
        })

        if (!viewedProduct) {
            viewedProduct = new ViewedProduct()
            viewedProduct.product = product
            viewedProduct.customer = req.customer
            viewedProduct.totalView = 1
        } else {
            viewedProduct.totalView++;
        }

        await viewedProduct.save()
        await Product.createQueryBuilder()
            .update()
            .set({
                totalView: () => `totalView + 1`
            })
            .where('id = :productId', { productId })
            .execute()

        return res.sendOK({})
    }


    @Post('/:productId/like')
    @UseAuth(VerificationJWT)
    @Validator({
        productId: Joi.required(),
    })
    async likeProduct(
        @HeaderParams("token") token: string,
        @PathParams('productId') productId: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const product = await Product.findOneOrThrowId(productId, null, '')

        let likedProduct = await LikedProduct.findOne({
            where: {
                customer: req.customer,
                product,
            }
        })

        if (!likedProduct) {
            likedProduct = new LikedProduct()
            likedProduct.product = product
            likedProduct.customer = req.customer
            await likedProduct.save()
            product.totalLike++
            await product.save()
        }

        return res.sendOK({})
    }


    @Delete('/:productId/dislike')
    @UseAuth(VerificationJWT)
    @Validator({
        productId: Joi.required(),
    })
    async dislikeProduct(
        @HeaderParams("token") token: string,
        @PathParams('productId') productId: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const product = await Product.findOneOrThrowId(productId, null, '')

        let likedProduct = await LikedProduct.findOne({
            where: {
                customer: req.customer,
                product,

            }
        })

        if (likedProduct) {
            await LikedProduct.delete(likedProduct.id)
            product.totalLike--;

            if (product.totalLike < 0) {
                product.totalLike = 0
            }
            await product.save()
        }

        return res.sendOK({})
    }



} // END FILE
