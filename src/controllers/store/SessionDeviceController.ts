// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { SessionDevice } from '../../entity/SessionDevice';
import { SessionDeviceService } from '../../services/SessionDeviceService';

@Controller("/store/sessionDevice")
@Docs("docs_store")
export class SessionDeviceController {
    constructor(
        private sessionDeviceService: SessionDeviceService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100),
        employeeId: Joi.required()
    })
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams("search") search: string = "",
        @QueryParams('employeeId') employeeId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { sessionDevices, total } = await this.sessionDeviceService.getManyAndCount({
            limit,
            search,
            page,
            employeeId,
            storeId: req.store.id
        })

        return res.sendOK({ sessionDevices, total });
    }

} // END FILE
