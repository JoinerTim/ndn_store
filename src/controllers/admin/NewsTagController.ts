// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { NewsTag } from '../../entity/NewsTag';
import { NewsTagService } from '../../services/NewsTagService';
import { News } from '../../entity/News';
import { BadRequest } from '@tsed/exceptions';

@Controller("/admin/newsTag")
@Docs("docs_admin")
export class NewsTagController {
    constructor(
        private newsTagService: NewsTagService
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
        const { newsTags, total } = await this.newsTagService.getManyAndCount({
            limit,
            search,
            page
        })

        return res.sendOK({ newsTags, total });
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        newsTag: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("newsTag") newsTag: NewsTag,
    ) {
        newsTag.name = newsTag.name.trim()
        await newsTag.save()
        return res.sendOK(newsTag)
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:newsTagId')
    @UseAuth(VerificationJWT)
    @Validator({
        newsTag: Joi.required(),
        newsTagId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("newsTag") newsTag: NewsTag,
        @PathParams("newsTagId") newsTagId: number,
    ) {
        await NewsTag.findOneOrThrowId(newsTagId)
        newsTag.name = newsTag.name.trim();
        newsTag.id = +newsTagId
        await newsTag.save()

        return res.sendOK(newsTag)
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:newsTagId')
    @UseAuth(VerificationJWT)
    @Validator({
        newsTagId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("newsTagId") newsTagId: number,
    ) {
        const newsTag = await NewsTag.findOneOrThrowId(newsTagId);

        const news = await News.createQueryBuilder('news')
            .innerJoin('news.newsTags', 'newsTag')
            .getOne()

        if (news) {
            throw new BadRequest(`Có tin tức '${news.title}' đang dùng từ khóa này. Không thể xóa`);
        }

        newsTag.isDeleted = true;
        await newsTag.save()

        return res.sendOK(newsTag)
    }

} // END FILE
