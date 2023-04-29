// IMPORT LIBRARY
import { Controller, Req, Request, Res, Response, HeaderParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { BannerService } from '../../services/BannerService';
import { UseAuthHash } from '../../middleware/auth/UseAuthHash';
import { UseNamespace } from '../../middleware/auth/UseNamespace';


@Controller("/customer/banner")
@Docs("docs_customer")
export class BannerController {
    constructor(
        private bannerService: BannerService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0)
    })
    @UseNamespace()
    @UseAuthHash()
    async findAll(
        @HeaderParams("token") token: string,
        @HeaderParams("is-dev") isDev: boolean,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @QueryParams("search") search: string = "",
        @QueryParams('bannerLayoutPageIds', Number) bannerLayoutPageIds: number[],
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { banners, total } = await this.bannerService.getManyAndCount({
            limit,
            search,
            page,
            isVisible: true,
            storeId: req.store.id
        })
        return res.sendOK({ banners, total });
    }


    @Get('/:bannerId')
    @Validator({
        bannerId: Joi.required()
    })
    @UseAuthHash()
    async findOne(
        @HeaderParams("token") token: string,
        @HeaderParams("is-dev") isDev: boolean,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('bannerId') bannerId: number
    ) {
        const banner = await this.bannerService.getOne(bannerId)
        return res.sendOK(banner)
    }
} // END FILE
