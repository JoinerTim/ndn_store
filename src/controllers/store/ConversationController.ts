// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Patch, MultipartFile } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';
import { escape } from 'mysql2';

// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Conversation } from '../../entity/Conversation';
import { ConversationService } from '../../services/ConversationService';
import { Summary } from '@tsed/schema';
import { ConversationMessage } from '../../entity/ConversationMessage';
import CONFIG from '../../../config';
import { Store } from '../../entity/Store';
import { Staff } from '../../entity/Staff';
import { MySocketService } from '../../services/MySocketService';
import { UserType } from '../../types/user';
import { getCurrentTimeInt } from '../../util/helper';
import { FlashSaleCampaign } from '../../entity/FlashSaleCampaign';
import { PromotionCampaign, PromotionDiscountType } from '../../entity/PromotionCampaign';


@Controller("/store/conversation")
@Docs("docs_store")
export class ConversationController {
    constructor(
        private conversationService: ConversationService,
        private socketService: MySocketService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(1).max(100)
    })
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const storeId = req.store.id;

        let where = `conversation.isDeleted = false AND store.id = :storeId`;

        const [conversations, total] = await Conversation.createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.owner', 'owner')
            .leftJoinAndSelect('conversation.store', 'store')
            .where(where, { storeId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('conversation.updatedAt', 'DESC')
            .getManyAndCount();

        return res.sendOK({ conversations, total });
    }

    @Get('/:conversationId/messages')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0)
    })
    async findMessages(
        @HeaderParams("token") token: string,
        @HeaderParams("device-id") deviceId: string,
        @HeaderParams("version") version: string,
        @PathParams('conversationId') conversationId: number,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = 'conversationMessage.isDeleted = 0 AND conversation.id = :conversationId AND store.id = :storeId';
        const storeId = req.store.id
        const current = getCurrentTimeInt();

        const subFlashSaleQuery = FlashSaleCampaign.createQueryBuilder('flashSaleCampaign')
            .select('flashSaleCampaign.id', 'id')
            .where(`${current} BETWEEN flashSaleCampaign.startAt AND flashSaleCampaign.endAt AND flashSaleCampaign.isDeleted = 0`)
            .andWhere(storeId ? `flashSaleCampaign.storeId = ${storeId}` : 'flashSaleCampaign.storeId is null');

        const subPromotionQuery = PromotionCampaign.createQueryBuilder('promotionCampaign')
            .select('promotionCampaign.id', 'id')
            .where(`${current} BETWEEN promotionCampaign.startAt AND promotionCampaign.endAt AND promotionCampaign.isDeleted = 0`)
            .andWhere(storeId ? `promotionCampaign.storeId = ${storeId}` : 'promotionCampaign.storeId is null');

        const subDiscountPromotionQuery = subPromotionQuery.clone()
            .andWhere(`promotionCampaign.discountType = ${escape(PromotionDiscountType.Percent)}`)

        const [messages, total] = await ConversationMessage.createQueryBuilder('conversationMessage')
            .leftJoinAndSelect('conversationMessage.conversation', 'conversation')
            .leftJoinAndSelect('conversationMessage.product', 'product')
            .leftJoinAndSelect('conversationMessage.sender', 'sender')
            .leftJoinAndSelect('conversation.store', 'store')
            .leftJoinAndSelect('conversation.owner', 'owner')
            .leftJoinAndSelect('product.promotionCampaignDetails', 'promotionCampaignDetail', `promotionCampaignDetail.promotionCampaignId IN (${subPromotionQuery.getQuery()})`)
            .leftJoinAndSelect('promotionCampaignDetail.promotionCampaign', 'promotionCampaign')
            .leftJoinAndSelect('product.productTags', 'productTags')
            .leftJoinAndSelect('product.productVariations', 'productVariation', 'productVariation.isDeleted = 0')
            .leftJoinAndSelect('product.productCustomFields', 'productCustomField')
            .leftJoinAndSelect('productCustomField.customField', 'customField')
            .leftJoin('product.productTags', 'productTag')
            .leftJoinAndSelect('product.flashSaleCampaignDetails', 'flashSaleCampaignDetail', `flashSaleCampaignDetail.isDeleted = 0 AND flashSaleCampaignDetail.flashSaleCampaignId IN (${subFlashSaleQuery.getQuery()})`)
            .leftJoinAndSelect('flashSaleCampaignDetail.flashSaleCampaign', 'flashSaleCampaign')
            .leftJoin('product.promotionCampaignDetails', 'promotionCampaignDetails2', `promotionCampaignDetails2.isGift = 0 AND promotionCampaignDetails2.promotionCampaignId IN (${subDiscountPromotionQuery.getQuery()})`)
            .where(where, { conversationId, storeId: req.store.id })
            .orderBy('conversationMessage.id', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount()

        return res.sendOK({ messages, total });
    }

    // =====================UPDATE ITEM=====================
    @Patch('/:conversationId/chat')
    @UseAuth(VerificationJWT)
    @Validator({
        conversationId: Joi.number().required()
    })
    async chat(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("message") message: ConversationMessage,
        @PathParams("conversationId") conversationId: number,
    ) {
        await this.conversationService.sendMessage({
            conversationId,
            message,
            employee: req.employee,
            sendBy: UserType.Store
        })

        return res.sendOK(message)
    }


    @Patch('/:conversationId/seenAll')
    @UseAuth(VerificationJWT)
    @Validator({
        conversationId: Joi.number().required()
    })
    async seenAllMessage(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("conversationId") conversationId: number,
    ) {

        const conversation = await Conversation.findOneOrThrowId(conversationId, null, '');
        const employeeId = req.employee.id
        const storeId = req.store.id


        const subQuery = Conversation.createQueryBuilder('conversation')
            .select('conversationMessage.id', 'id')
            .leftJoin('conversation.store', 'store')
            .leftJoin('conversation.conversationMessages', 'conversationMessage')
            .innerJoin('conversationMessage.seenEmployees', 'seenEmployees', `seenEmployees.id = ${employeeId}`)
            .where(`store.id = ${storeId} AND conversationMessage.sendBy != ${escape(UserType.Store)}`)

        let where = `conversation.isDeleted = false AND conversationMessage.sendBy != ${escape(UserType.Store)} AND conversationMessage.id NOT IN (${subQuery.getQuery()})`;

        const conversationMessages = await ConversationMessage.createQueryBuilder('conversationMessage')
            .leftJoin('conversationMessage.conversation', 'conversation')
            .leftJoin('conversation.owner', 'owner')
            .leftJoin('conversation.target', 'target')
            .leftJoin('conversation.store', 'store')
            .leftJoinAndSelect('conversationMessage.seenEmployees', 'seenEmployees')
            .where(where, {})
            .getMany();

        for (const message of conversationMessages) {
            message.seenEmployees.push(req.employee)
        }

        await ConversationMessage.save(conversationMessages)


        res.sendOK({})
    }

    @Post('/upload')
    @UseAuth(VerificationJWT)
    uploadFile(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @MultipartFile('file') file: Express.Multer.File,
    ) {
        file.path = file.path.replace(CONFIG.UPLOAD_DIR, '');
        return res.sendOK(file)
    }
} // END FILE
