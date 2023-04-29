// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Patch, Delete } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Banner } from '../../entity/Banner';
import { BannerService } from '../../services/BannerService';


@Controller("/store/banner")
@Docs("docs_store")
export class BannerController {
    constructor(
        private bannerService: BannerService
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
        const { banners, total } = await this.bannerService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id
        })
        return res.sendOK({ banners, total });
    }

    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        banner: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("banner") banner: Banner,
        @BodyParams('newsId') newsId: number,
    ) {

        if (newsId) await banner.assignNews(newsId);
        banner.store = req.store;
        await banner.save();

        return res.sendOK(banner)
    }

    // =====================UPDATE ITEM=====================
    @Patch('/:bannerId')
    @UseAuth(VerificationJWT)
    @Validator({
        banner: Joi.required(),
        bannerId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("banner") banner: Banner,
        @PathParams("bannerId") bannerId: number,
        @BodyParams('newsId') newsId: number,
    ) {
        await Banner.findOneOrThrowId(bannerId)
        banner.id = +bannerId;


        if (newsId) {
            await banner.assignNews(newsId)
        } else if (newsId == 0) {
            banner.news = null;
        }

        await banner.save()

        return res.sendOK(banner)
    }

    @Delete('/:bannerId')
    @UseAuth(VerificationJWT)
    @Validator({
        bannerId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("bannerId") bannerId: number,
    ) {
        const banner = await Banner.findOneOrThrowId(bannerId)
        await banner.delete()

        return res.sendOK(banner)
    }

} // END FILE
