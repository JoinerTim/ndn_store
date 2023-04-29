// IMPORT LIBRARY
import { Controller, Req, Request, Res, Response, HeaderParams, Get, PathParams, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';

// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { News } from '../../entity/News';
import { NewsService } from '../../services/NewsService';
import { CustomerService } from '../../services/CustomerService';
import { UseAuthHash } from '../../middleware/auth/UseAuthHash';
import { UseNamespace } from '../../middleware/auth/UseNamespace';


@Controller("/customer/news")
@Docs("docs_customer")
export class NewsController {
    constructor(
        private newsService: NewsService,
        private customerService: CustomerService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @Validator({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100)
    })
    @UseNamespace()
    @UseAuthHash()
    async findAll(
        @HeaderParams("token") token: string,
        @HeaderParams("is-dev") isDev: boolean,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams("search") search: string = "",
        @QueryParams('isHighlight') isHighlight: boolean,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const storeId = req.store.id;
        const { total, newses } = await this.newsService.getManyAndCount({
            page,
            limit,
            search,
            isVisible: true,
            sortBy: 'position',
            isHighlight,
            storeId
        })

        if (isHighlight && !newses.length) {
            const { total, newses } = await this.newsService.getManyAndCount({
                page: 1,
                limit: 3,
                search,
                isVisible: true,
                sortBy: 'position',
                storeId
            })

            return res.sendOK({
                newses,
                total
            })
        }

        return res.sendOK({ newses, total });
    }


    @Get('/relation')
    @Validator({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100)
    })
    @UseNamespace()
    @UseAuthHash()
    async getRelation(
        @HeaderParams("token") token: string,
        @HeaderParams("is-dev") isDev: boolean,
        @QueryParams('newsId') newsId: number,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const news = await News.findOneOrThrowId(newsId, {
            relations: ['newsTags'],
            where: {
                store: req.store
            }
        }, '');

        if (!news.newsTags.length) {
            return res.sendOK({
                newses: [],
                total: 0
            })
        }

        const [relationNews, total] = await News.createQueryBuilder('news')
            .leftJoin('news.newsTags', 'newsTag')
            .where('newsTag.id IN (:...newsTagIds)', {
                newsTagIds: news.newsTags.map(e => e.id)
            })
            .orderBy('news.id', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount()

        res.sendOK({
            newses: relationNews,
            total
        })

    }


    @Get('/:newsId')
    @Validator({
        newsId: Joi.number().required()
    })
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("newsId") newsId: number,
    ) {
        const query = News.createQueryBuilder('news')
            .where('news.id = :newsId', { newsId })


        const news = await query
            .getOne()

        news.totalViews++;
        await news.save()

        return res.sendOK(news)
    }

} // END FILE
