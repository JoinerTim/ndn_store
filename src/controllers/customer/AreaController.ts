// IMPORT LIBRARY
import { Controller, Req, Get, Res, Response, HeaderParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { AreaService } from '../../services/AreaService';

@Controller("/customer/area")
@Docs("docs_customer")
export class AreaController {
    constructor(
        private areaService: AreaService
    ) { }


    // =====================GET LIST=====================
    @Get('')
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
        const { areas, total } = await this.areaService.getManyAndCount({
            limit,
            search,
            page
        });

        return res.sendOK({ areas, total });
    }

} // END FILE
