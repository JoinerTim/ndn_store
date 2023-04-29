// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams, BodyParams, Post, Patch } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { DeliveryAddress } from '../../entity/DeliveryAddress';
import { DeliveryAddressService } from '../../services/DeliveryAddressService';
import { Customer } from '../../entity/Customer';

@Controller("/store/deliveryAddress")
@Docs("docs_store")
export class DeliveryAddressController {
    constructor(
        private deliveryAddressService: DeliveryAddressService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100),
        customerId: Joi.required()
    })
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams("search") search: string = "",
        @QueryParams('customerId') customerId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { deliveryAddresses, total } = await this.deliveryAddressService.getManyAndCount({
            limit,
            search,
            page,
            customerId,
            storeId: req.store.id
        })

        return res.sendOK({ deliveryAddresses, total });
    }

    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        deliveryAddress: Joi.required(),
        customerId: Joi.required()
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('customerId') customerId: number,
        @BodyParams("deliveryAddress") deliveryAddress: DeliveryAddress,
        @BodyParams('cityId') cityId: number,
        @BodyParams('districtId') districtId: number,
        @BodyParams('wardId') wardId: number,
    ) {
        const customer = await Customer.findOneOrThrowId(customerId, {
            where: {
                store: req.store
            }
        }, '')

        await deliveryAddress.assignCity(cityId)
        await deliveryAddress.assignDistrict(districtId)
        await deliveryAddress.assignWard(wardId)

        deliveryAddress.customer = customer

        if (deliveryAddress.isDefault) {
            await DeliveryAddress.createQueryBuilder()
                .update()
                .set({
                    isDefault: false
                })
                .where('customerId = :customerId', { customerId: customer.id })
                .execute()
        }

        await deliveryAddress.save()
        return res.sendOK(deliveryAddress)
    }

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


} // END FILE
