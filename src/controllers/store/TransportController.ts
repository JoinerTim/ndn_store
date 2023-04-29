// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { Enum } from '@tsed/schema';

// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Transport, TransportSericeType } from '../../entity/Transport';
import { TransportService } from '../../services/TransportService';
@Controller("/store/transport")
@Docs("docs_store")
export class TransportController {
    constructor(
        private transportService: TransportService
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
        @QueryParams("productId") productId: number,
        @QueryParams('type') @Enum(TransportSericeType) type: TransportSericeType,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const store = req.store
        const { transports, total } = await this.transportService.getManyAndCount({ page, limit, search, store, productId })
        return res.sendOK({ transports, total });
    }


    @Get('/:transportId')
    @UseAuth(VerificationJWT)
    @Validator({
        transportId: Joi.required()
    })
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('transportId') transportId: number
    ) {
        const transport = await this.transportService.getOne(transportId, req.store.id)
        return res.sendOK(transport)
    }

    @Post('/')
    @UseAuth(VerificationJWT)
    @Validator({
        transport: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("transport") transport: Transport,
    ) {
        transport.store = req.store
        await transport.save();

        return res.sendOK(transport)
    }


    @Patch('/:transportId')
    @UseAuth(VerificationJWT)
    @Validator({
        transport: Joi.required(),
        transportId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("transport") transport: Transport,
        @PathParams("transportId") transportId: number,
    ) {

        const oldTransport = await Transport.findOneOrThrowOption({
            where: { id: transportId, storeId: req.store.id }
        })

        transport.id = +transportId;

        await transport.save()

        return res.sendOK(transport)
    }


    @Delete('/:transportId')
    @UseAuth(VerificationJWT)
    @Validator({
        transportId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("transportId") transportId: number,
    ) {
        const transport = await Transport.findOneOrThrowOption({
            where: { id: transportId, storeId: req.store.id }
        })
        transport.isDeleted = true

        await transport.save()

        return res.sendOK(transport)
    }

} // END FILE
