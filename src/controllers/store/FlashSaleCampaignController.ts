// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { FlashSaleCampaign } from '../../entity/FlashSaleCampaign';
import { FlashSaleCampaignService } from '../../services/FlashSaleCampaignService';
import { FlashSaleCampaignDetailInsert } from '../../entity-request/FlashSaleCampaignDetailInsert';
import { FlashSaleCampaignDetail } from '../../entity/FlashSaleCampaignDetail';
import { getCurrentTimeInt } from '../../util/helper';
import { BadRequest } from '@tsed/exceptions';

@Controller("/store/flashSaleCampaign")
@Docs("docs_store")
export class FlashSaleCampaignController {
    constructor(
        private flashSaleCampaignService: FlashSaleCampaignService
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
        @QueryParams("dateType") dateType: 'coming' | 'current' | 'end', //current: đang diễn ra
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { flashSaleCampaigns, total } = await this.flashSaleCampaignService.getManyAndCount({
            limit,
            search,
            page,
            dateType,
            storeId: req.store.id
        })

        return res.sendOK({ flashSaleCampaigns, total });
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        flashSaleCampaign: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("flashSaleCampaign") flashSaleCampaign: FlashSaleCampaign,
        @BodyParams('flashSaleCampaignDetails', FlashSaleCampaignDetailInsert) details: FlashSaleCampaignDetailInsert[],
    ) {
        const storeId = req.store.id
        const flashSaleCampaignDetails = await Promise.all(details.map(e => e.toFlashSaleCampaignDetail()));
        await flashSaleCampaign.assignStore(storeId)

        flashSaleCampaign.flashSaleCampaignDetails = flashSaleCampaignDetails;
        await this.flashSaleCampaignService.validate(flashSaleCampaign, flashSaleCampaign.store)

        await FlashSaleCampaignDetail.save(flashSaleCampaignDetails);
        await flashSaleCampaign.save();

        return res.sendOK(flashSaleCampaign)
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:flashSaleCampaignId')
    @UseAuth(VerificationJWT)
    @Validator({
        flashSaleCampaign: Joi.required(),
        flashSaleCampaignId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("flashSaleCampaign") flashSaleCampaign: FlashSaleCampaign,
        @PathParams("flashSaleCampaignId") flashSaleCampaignId: number,
        @BodyParams('flashSaleCampaignDetails', FlashSaleCampaignDetailInsert) details: FlashSaleCampaignDetailInsert[],
    ) {
        const storeId = req.store.id

        const oldFlashSaleCampaign = await FlashSaleCampaign.findOneOrThrowId(flashSaleCampaignId, {
            relations: ['store']
        })

        const current = getCurrentTimeInt()
        if (oldFlashSaleCampaign.endAt < current || (current >= oldFlashSaleCampaign.startAt && current <= oldFlashSaleCampaign.endAt)) {
            throw new BadRequest("Không thể sửa chiến khi đang diễn ra hoặc đã kết thúc");
        }

        flashSaleCampaign.id = +flashSaleCampaignId;

        const flashSaleCampaignDetails = await Promise.all(details.map(e => e.toFlashSaleCampaignDetail()));

        if (storeId) await flashSaleCampaign.assignStore(storeId)

        flashSaleCampaign.flashSaleCampaignDetails = flashSaleCampaignDetails;
        await this.flashSaleCampaignService.validate(flashSaleCampaign, oldFlashSaleCampaign.store || flashSaleCampaign.store)


        await FlashSaleCampaignDetail.save(flashSaleCampaignDetails);

        await flashSaleCampaign.save();

        return res.sendOK(flashSaleCampaign)
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:flashSaleCampaignId')
    @UseAuth(VerificationJWT)
    @Validator({
        flashSaleCampaignId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("flashSaleCampaignId") flashSaleCampaignId: number,
    ) {
        const flashSaleCampaign = await FlashSaleCampaign.findOneOrThrowId(flashSaleCampaignId, {
            where: {
                store: req.store
            }
        })
        flashSaleCampaign.isDeleted = true;
        await flashSaleCampaign.save()

        return res.sendOK(flashSaleCampaign)
    }

} // END FILE
