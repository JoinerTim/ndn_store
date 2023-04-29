// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import { Summary } from '@tsed/schema';;
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { ProductRate } from '../../entity/ProductRate';
import { Product } from '../../entity/Product';
import { BadRequest } from '@tsed/exceptions';
import { ProductRateService } from '../../services/ProductRateService';
import { Order } from '../../entity/Order';
import { Media } from '../../entity/Media';
import { UseAuthHash } from '../../middleware/auth/UseAuthHash';
import { CustomerTransactionService } from '../../services/CustomerTransactionService';
import { UseNamespace } from '../../middleware/auth/UseNamespace';


@Controller("/customer/productRate")
@Docs("docs_customer")
export class ProductRateController {
    constructor(
        private productRateService: ProductRateService,
        private customerTransactionService: CustomerTransactionService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0),
        productId: Joi.required()
    })
    @UseAuthHash()
    async findAll(
        @HeaderParams("token") token: string,
        @HeaderParams("is-dev") isDev: boolean,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
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
            star,
            productId
        })
        return res.sendOK({ productRates, total });
    }

    @Get('/my')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100)
    })
    async getMyRate(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams("search") search: string = "",
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const { productRates, total } = await this.productRateService.getManyAndCount({
            limit,
            search,
            page,
            customerId: req.customer.id
        });

        return res.sendOK({
            productRates, total
        })
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @Summary('Tạo đánh giá')
    @UseAuth(VerificationJWT)
    @UseNamespace()
    @Validator({
        productRate: Joi.required(),
        productId: Joi.required(),
        orderId: Joi.required()
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("productRate") productRate: ProductRate,
        @BodyParams('productId') productId: number,
        @BodyParams('images', String) images: string[],
        @BodyParams('orderId') orderId: number,
    ) {
        const store = req.store
        const customer = req.customer
        const order = await Order.findOneOrThrowId(orderId);
        if (!productRate.star) {
            throw new BadRequest("Số sao ít nhất là 1");
        };

        if (productRate.star > 5) {
            throw new BadRequest("Số sao lớn nhất là 5");
        };

        const product = await Product.findOneOrThrowId(productId);

        product.totalStar += productRate.star;
        product.totalRate++;
        await product.save();

        productRate.product = product;
        productRate.customer = req.customer;
        productRate.order = order;

        if (images?.length) {
            productRate.assignImages(images)
            await Media.save(productRate.images);
        }

        await productRate.save()

        // send notification to store
        await this.productRateService.sendNotification(order, product, productRate, store, customer)

        return res.sendOK(productRate)
    }

    @Get('/:productRateId')
    @UseAuth(VerificationJWT)
    @Validator({
        productRateId: Joi.required()
    })
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('productRateId') productRateId: number
    ) {
        const storeId = req.store.id
        const productRate = await this.productRateService.getOne(productRateId, storeId)
        return res.sendOK(productRate)
    }

} // END FILE
