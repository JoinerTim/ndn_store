// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Area } from '../../entity/Area';
import { AreaService } from '../../services/AreaService';
import { Store } from '../../entity/Store';
import { BadRequest } from '@tsed/exceptions';

@Controller("/admin/area")
@Docs("docs_admin")
export class AreaController {
    constructor(
        private areaService: AreaService
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
        const { areas, total } = await this.areaService.getManyAndCount({
            limit,
            search,
            page
        })

        return res.sendOK({ areas, total });
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        area: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("area") area: Area,
    ) {
        await area.save()
        return res.sendOK(area)
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:areaId')
    @UseAuth(VerificationJWT)
    @Validator({
        area: Joi.required(),
        areaId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("area") area: Area,
        @PathParams("areaId") areaId: number,
    ) {
        await Area.findOneOrThrowId(areaId)
        area.id = +areaId
        await area.save()

        return res.sendOK(area)
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:areaId')
    @UseAuth(VerificationJWT)
    @Validator({
        areaId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("areaId") areaId: number,
    ) {
        const area = await Area.findOneOrThrowId(areaId)

        const store = await Store.createQueryBuilder('store')
            .innerJoin('store.area', 'area', 'area.id = :areaId', { areaId })
            .getOne()

        if (store) {
            throw new BadRequest("Khu vực này đã có cửa hàng, không thể xóa!");
        }

        area.isDeleted = true;
        await area.save()

        return res.sendOK(area)
    }

} // END FILE
