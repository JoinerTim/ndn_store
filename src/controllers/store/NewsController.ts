// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Patch, Delete } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { News } from '../../entity/News';
import { NewsService } from '../../services/NewsService';


@Controller("/store/news")
@Docs("docs_store")
export class NewsController {
    constructor(
        private newsService: NewsService,
    ) { }


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
        @QueryParams('isVisible') isVisible: boolean,
        @QueryParams('newsTagIds', Number) newsTagIds: number[],
        @QueryParams('queryObject') queryObject: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { total, newses } = await this.newsService.getManyAndCount({
            page,
            limit,
            search,
            isVisible,
            newsTagIds,
            queryObject,
            storeId: req.store.id
        })

        return res.sendOK({ newses, total });
    }

    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        news: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("news") news: News,
        @BodyParams('productCategoryId') productCategoryId: number,
        @BodyParams('newsTagIds', Number) newsTagIds: number[],
    ) {
        if (newsTagIds?.length) {
            await news.assignNewsTags(newsTagIds)
        }

        news.store = req.store
        await news.save()
        return res.sendOK(news)
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:newsId')
    @UseAuth(VerificationJWT)
    @Validator({
        news: Joi.required(),
        newsId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("news") news: News,
        @PathParams("newsId") newsId: number,
        @BodyParams('newsTagIds', Number) newsTagIds: number[],
    ) {
        await News.findOneOrThrowId(newsId, {
            where: {
                store: req.store
            }
        })

        if (newsTagIds?.length) {
            await news.assignNewsTags(newsTagIds)
        } else if (newsTagIds?.length == 0) {
            news.newsTags = null;
        }

        news.id = +newsId
        await news.save()

        return res.sendOK(news)
    }

    @Delete('/:newsId')
    @UseAuth(VerificationJWT)
    @Validator({
        newsId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("newsId") newsId: number,
    ) {
        const news = await News.findOneOrThrowId(newsId, {
            where: {
                store: req.store
            }
        })
        news.isDeleted = true;

        await news.save()

        return res.sendOK(news)
    }

} // END FILE
