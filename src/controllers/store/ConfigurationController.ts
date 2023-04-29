// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import { Summary } from '@tsed/schema';;
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Configuration, ConfigurationParam } from '../../entity/Configuration';
import { ConfigurationService } from '../../services/ConfigurationService';
import { BadRequest } from '@tsed/exceptions';


@Controller("/store/configuration")
@Docs("docs_store")
export class ConfigurationController {
    constructor(
        private configurationService: ConfigurationService
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
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `configuration.isDeleted = false `

        const [configurations, total] = await Configuration.createQueryBuilder('configuration')
            .leftJoinAndSelect("configuration.store", "store")
            .where(where, { search: `%${search}%` })
            .andWhere("store.id = :storeId", { storeId: req.store.id })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('configuration.id', 'DESC')
            .getManyAndCount()

        return res.sendOK({ configurations, total });
    }

    @Get('/param')
    @UseAuth(VerificationJWT)
    @Summary('Get configuration by param')
    @Validator({
        param: Joi.required()
    })
    async findByParam(
        @HeaderParams("token") token: string,
        @QueryParams('param') param: ConfigurationParam,
        @Req() req: Request,
        @Res() res: Response
    ) {

        const config = await Configuration.findOneOrThrowOption({
            where: {
                param,
                store: req.store.id
            },
        })
        return res.sendOK(config);
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:configurationId')
    @UseAuth(VerificationJWT)
    @Validator({
        configuration: Joi.required(),
        configurationId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("configuration") configuration: Configuration,
        @PathParams("configurationId") configurationId: number,
    ) {
        await Configuration.findOneOrThrowId(configurationId, {
            where: {
                store: req.store
            }
        })
        configuration.id = +configurationId

        if (configuration.param == ConfigurationParam.PointRefundRate && (isNaN(+configuration.value) || +configuration.value > 1)) {
            throw new BadRequest("Giá trị không hợp lệ!");
        }

        await configuration.save()

        this.configurationService.getConfigurations()

        return res.sendOK(configuration)
    }



} // END FILE
