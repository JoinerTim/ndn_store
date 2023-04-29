// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams, BodyParams, Post, Patch, Delete } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Deprecated } from '@tsed/schema';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Warehouse } from '../../entity/Warehouse';
import { WarehouseService } from '../../services/WarehouseService';
import { Product } from '../../entity/Product';
import { ProductCustomFieldInsert } from '../../entity-request/ProductCustomFieldInsert';
import { ProductService } from '../../services/ProductService';
import { DepotService } from '../../services/DepotService';
import { Depot } from '../../entity/Depot';
import { BadRequest } from '@tsed/exceptions';


@Controller("/store/depot")
@Docs("docs_store")
export class DepotController {
    constructor(
        private warehouseService: WarehouseService,
        private productService: ProductService,
        private depotService: DepotService
    ) { }

    @Get("/")
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
        const { depots, total } = await this.depotService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id
        })

        return res.sendOK({ depots, total });
    }

    @Get('/:depotId')
    @UseAuth(VerificationJWT)
    @Validator({
        depotId: Joi.required()
    })
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('depotId') depotId: number,
    ) {
        const storeId = req.store.id
        const depot = await this.depotService.getOne(depotId, storeId)
        return res.sendOK(depot)
    }

    @Post('/')
    @UseAuth(VerificationJWT)
    @Deprecated()
    @Validator({
        depot: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("depot") depot: Depot,
        @BodyParams("cityId") cityId: number,
        @BodyParams("districtId") districtId: number,
        @BodyParams("wardId") wardId: number
    ) {

        throw new BadRequest("Method is deprecated!");

        if (cityId) {
            await depot.assignCity(cityId)
        }
        if (districtId) {
            await depot.assignDistrict(districtId)
        }
        if (wardId) {
            await depot.assignWard(wardId)
        }

        depot.store = req.store
        await depot.generateCode()
        await depot.save();

        return res.sendOK(depot)
    }

    @Patch('/:depotId')
    @UseAuth(VerificationJWT)
    @Deprecated()
    @Validator({
        depot: Joi.required(),
        depotId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("depot") depot: Depot,
        @PathParams("depotId") depotId: number,
        @BodyParams("cityId") cityId: number,
        @BodyParams("districtId") districtId: number,
        @BodyParams("wardId") wardId: number
    ) {
        throw new BadRequest("Method is deprecated!");

        if (cityId) {
            await depot.assignCity(cityId)
        }
        if (districtId) {
            await depot.assignDistrict(districtId)
        }
        if (wardId) {
            await depot.assignWard(wardId)
        }

        await Depot.findOneOrThrowOption({ where: { id: depotId, store: req.store } })
        depot.id = +depotId;

        await depot.save()

        return res.sendOK(depot)
    }

    @Delete('/:depotId')
    @UseAuth(VerificationJWT)
    @Deprecated()
    @Validator({
        depotId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("depotId") depotId: number,
    ) {
        throw new BadRequest("Method is deprecated!");

        const depot = await Depot.findOneOrThrowOption({ where: { id: depotId, store: req.store } })
        depot.isDeleted = true
        await depot.save()
        return res.sendOK(depot)
    }

} // END FILE
