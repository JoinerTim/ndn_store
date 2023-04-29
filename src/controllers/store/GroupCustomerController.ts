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
import { BadRequest, Forbidden } from '@tsed/exceptions';
import { UseAuthHash } from '../../middleware/auth/UseAuthHash';
import { GroupCustomerService } from '../../services/GroupCustomerService';
import { GroupCustomer } from '../../entity/GroupCustomer';
import { Notification } from '../../entity/Notification';
import { Enum } from '@tsed/schema';


@Controller("/store/groupCustomer")
@Docs("docs_store")
export class GroupCustomerController {
    constructor(
        private groupCustomerService: GroupCustomerService,
        private customerService: CustomerService
    ) { }


    @Get('/')
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
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { groupCustomers, total } = await this.groupCustomerService.getManyAndCount({ page, limit, search, store: req.store })
        return res.sendOK({ groupCustomers, total })
    }

    @Get('/:groupCustomerId')
    @UseAuth(VerificationJWT)
    @Validator({
        groupCustomerId: Joi.required()
    })
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('groupCustomerId') groupCustomerId: number
    ) {
        const groupCustomer = await this.groupCustomerService.getOne(groupCustomerId, req.store)
        return res.sendOK(groupCustomer)
    }


    @Post('/')
    @UseAuth(VerificationJWT)
    @Validator({
        groupCustomer: Joi.required(),
        customerIds: Joi.required()
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("groupCustomer") groupCustomer: GroupCustomer,
        @BodyParams("customerIds", Number) customerIds: Number[],

    ) {
        const data = await this.groupCustomerService.createOrUpdate({ groupCustomer, customerIds, store: req.store })

        return res.sendOK(data)
    }

    @Patch('/:groupCustomerId')
    @UseAuth(VerificationJWT)
    @Validator({
        groupCustomer: Joi.required(),
        groupCustomerId: Joi.number().required(),
        customerIds: Joi.required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("groupCustomer") groupCustomer: GroupCustomer,
        @PathParams("groupCustomerId") groupCustomerId: number,
        @BodyParams("customerIds", Number) customerIds: Number[],

    ) {
        const data = await this.groupCustomerService.createOrUpdate({ groupCustomer, customerIds, store: req.store, groupCustomerId })

        return res.sendOK(data)
    }

    @Delete('/:groupCustomerId')
    @UseAuth(VerificationJWT)
    @Validator({
        groupCustomerId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("groupCustomerId") groupCustomerId: number,
    ) {
        const groupCustomer = await GroupCustomer.findOneOrThrowOption({ where: { id: groupCustomerId, store: req.store } })
        groupCustomer.isDeleted = true

        await groupCustomer.save()

        return res.sendOK(groupCustomer)
    }

} // END FILE
