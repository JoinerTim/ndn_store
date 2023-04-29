// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Summary } from '@tsed/schema';;
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Configuration, ConfigurationParam } from '../../entity/Configuration';


@Controller("/customer/configuration")
@Docs("docs_customer")
export class ConfigurationController {
    constructor() { }


    @Get('/param')
    @Summary('Get configuration by param')
    @Validator({
        param: Joi.required()
    })
    async findByParam(
        @HeaderParams("token") token: string,
        @QueryParams('param') param: ConfigurationParam,
        @QueryParams('version') version: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `configuration.param = :param`;

        if (version) {
            where += ' AND configuration.version <= :version'
        }

        const config = await Configuration.createQueryBuilder('configuration')
            .where(where, { param, version })
            .getOne();

        return res.sendOK(config);
    }

} // END FILE
