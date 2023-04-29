// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { DeliveryAddress } from '../../entity/DeliveryAddress';
import { DeliveryAddressService } from '../../services/DeliveryAddressService';
import { UseNamespace } from '../../middleware/auth/UseNamespace';

@Controller("/customer/deliveryAddress")
@Docs("docs_customer")
export class DeliveryAddressController {
    constructor(
        private deliveryAddressService: DeliveryAddressService
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
        const { deliveryAddresses, total } = await this.deliveryAddressService.getManyAndCount({
            limit,
            search,
            page,
            customerId: req.customer.id
        });

        return res.sendOK({ deliveryAddresses, total });
    }


    @Get('/default')
    @UseAuth(VerificationJWT)
    @UseNamespace()
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const deliveryAddress = await this.deliveryAddressService.getOne(req.customer.id, req.store.id)
        return res.sendOK(deliveryAddress)
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        deliveryAddress: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("deliveryAddress") deliveryAddress: DeliveryAddress,
        @BodyParams('cityId') cityId: number,
        @BodyParams('districtId') districtId: number,
        @BodyParams('wardId') wardId: number,
    ) {
        await deliveryAddress.assignCity(cityId)
        await deliveryAddress.assignDistrict(districtId)
        await deliveryAddress.assignWard(wardId)

        deliveryAddress.customer = req.customer

        if (deliveryAddress.isDefault) {
            await DeliveryAddress.createQueryBuilder()
                .update()
                .set({
                    isDefault: false
                })
                .where('customerId = :customerId', { customerId: req.customer.id })
                .execute()
        }

        await deliveryAddress.save()
        return res.sendOK(deliveryAddress)
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:deliveryAddressId')
    @UseAuth(VerificationJWT)
    @Validator({
        deliveryAddress: Joi.required(),
        deliveryAddressId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("deliveryAddress") deliveryAddress: DeliveryAddress,
        @PathParams("deliveryAddressId") deliveryAddressId: number,
        @BodyParams('cityId') cityId: number,
        @BodyParams('districtId') districtId: number,
        @BodyParams('wardId') wardId: number,
    ) {
        await DeliveryAddress.findOneOrThrowId(deliveryAddressId)

        await deliveryAddress.assignCity(cityId)
        await deliveryAddress.assignDistrict(districtId)
        await deliveryAddress.assignWard(wardId)
        deliveryAddress.customer = req.customer

        if (deliveryAddress.isDefault) {
            await DeliveryAddress.createQueryBuilder()
                .update()
                .set({
                    isDefault: false
                })
                .where('customerId = :customerId', { customerId: req.customer.id })
                .execute()
        }

        deliveryAddress.id = +deliveryAddressId
        await deliveryAddress.save()

        return res.sendOK(deliveryAddress)
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:deliveryAddressId')
    @UseAuth(VerificationJWT)
    @Validator({
        deliveryAddressId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("deliveryAddressId") deliveryAddressId: number,
    ) {
        const deliveryAddress = await DeliveryAddress.findOneOrThrowId(deliveryAddressId)
        deliveryAddress.isDeleted = true;
        await deliveryAddress.save()

        return res.sendOK(deliveryAddress)
    }

} // END FILE
