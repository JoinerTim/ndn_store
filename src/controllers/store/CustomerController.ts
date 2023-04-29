import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Patch, Delete } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import { Deprecated, Summary } from '@tsed/schema';
import Joi from '@hapi/joi';

import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Customer } from '../../entity/Customer';
import { Password } from '../../util/password';
import { CustomerService } from '../../services/CustomerService';
import { NotificationService } from '../../services/NotificationService';
import { CustomerInsert } from '../../entity-request/CustomerInsert';
import { Forbidden } from '@tsed/exceptions';
import { UseAuthHash } from '../../middleware/auth/UseAuthHash';
import JWT, { AuthType } from '../../middleware/auth/strategy/JWT';

@Controller("/store/customer")
@Docs("docs_store")
export class CustomerController {
    constructor(
        private customerService: CustomerService
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
        @QueryParams('isBlocked') isBlocked: boolean,
        @QueryParams('queryObject') queryObject: string,
        @QueryParams('customerRankId') customerRankId: number,
        @QueryParams('type') type: 'NEW' | 'REGULAR' | 'RISK',
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { customers, total } = await this.customerService.getManyAndCount({
            limit,
            search,
            page,
            isBlocked,
            queryObject,
            customerRankId,
            type,
            storeId: req.store.id
        })

        await this.customerService.mapStockUpRate(customers)

        return res.sendOK({ customers, total });
    }

    @Get('/fix/cycleBuy')
    @UseAuth(VerificationJWT)
    @Deprecated()
    @Summary('Fix chu kỳ mua hàng')
    @Validator({

    })
    async fixCyCleBuy(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        throw new Forbidden("Method is deprecated!");
        const customers = await Customer.find()
        for (const customer of customers) {
            await customer.calcBuyCycle();
        }

        // await Customer.save(customers, {
        //     chunk: 50
        // })

        return res.sendOK({})
    }

    @Post('/')
    @UseAuth(VerificationJWT)
    @Validator({
        customer: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("customer") customerInsert: CustomerInsert,
    ) {
        const customer = await customerInsert.toCustomer()
        await this.customerService.validateDuplicate(customer, req.store, null);

        customer.store = req.store;
        await customer.generateCode()
        await customer.save();

        return res.sendOK(customer)
    }



    // =====================UPDATE ITEM=====================
    @Patch('/:customerId/block')
    @UseAuth(VerificationJWT)
    @Validator({
        isBlocked: Joi.required(),
        customerId: Joi.number().required()
    })
    async updateBlock(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @QueryParams('isBlocked') isBlocked: boolean,
        @PathParams("customerId") customerId: number,
    ) {
        const customer = await Customer.findOneOrThrowId(customerId, null, '')

        customer.isBlocked = isBlocked;

        await customer.save()

        return res.sendOK(customer)
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:customerId')
    @UseAuth(VerificationJWT)
    @Validator({
        customer: Joi.required(),
        customerId: Joi.number().required()
    })
    async update(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @BodyParams("customer") customerInsert: CustomerInsert,
        @PathParams("customerId") customerId: number,
    ) {
        await Customer.findOneOrThrowId(customerId, null, '')

        const customer = await customerInsert.toCustomer()
        await this.customerService.validateDuplicate(customer, req.store, customerId);

        delete customer.password;
        customer.id = customerId;

        await customer.save()

        return res.sendOK(customer, 'Cập nhật thành công!')
    }

    @Patch('/:customerId/password')
    @UseAuthHash()
    @UseAuth(VerificationJWT)
    @Validator({
        customerId: Joi.number().required()
    })
    async updatePassword(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("customerId") customerId: number,
        @BodyParams('password') password: string,
    ) {
        const customer = await Customer.findOneOrThrowId(customerId)
        customer.password = await Password.hash(password)

        await customer.save()

        return res.sendOK({})
    }



    // =====================GET ITEM=====================
    @Get('/:customerId')
    @UseAuth(VerificationJWT)
    @Validator({
        customerId: Joi.number().required(),
    })
    async findOne(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
        @PathParams("customerId") customerId: number,
    ) {
        const customer = await Customer.findOneOrThrowId(+customerId, {
            where: {
                store: req.store
            }
        })

        return res.sendOK(customer)
    }

    @Delete('/')
    @UseAuth(VerificationJWT)
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {

        await Customer.createQueryBuilder()
            .update()
            .set({
                isDeleted: true
            })
            .where('zaloId != "" AND storeId = :storeId', { storeId: req.store.id })
            .execute()

        return res.sendOK({})
    }
} // END FILE
