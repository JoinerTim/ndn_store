// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Patch, MultipartFile } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Conversation } from '../../entity/Conversation';
import { ConversationService } from '../../services/ConversationService';
import { Summary } from '@tsed/schema';
import { ConversationMessage } from '../../entity/ConversationMessage';
import CONFIG from '../../../config';
import { Store } from '../../entity/Store';
import { MySocketService } from '../../services/MySocketService';
import { UserType } from '../../types/user';
import { escape } from 'mysql2';
import { FlashSaleCampaign } from '../../entity/FlashSaleCampaign';
import { UseNamespace } from '../../middleware/auth/UseNamespace';
import { getCurrentTimeInt } from '../../util/helper';
import { PromotionCampaign, PromotionDiscountType } from '../../entity/PromotionCampaign';
import { BadRequest } from '@tsed/exceptions';


@Controller("/customer/conversation")
@Docs("docs_customer")
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
        @HeaderParams("device-id") deviceId: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `conversation.isDeleted = false AND owner.id = :ownerId AND store.isDeleted = false`;

        const [conversations, total] = await Conversation.createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.owner', 'owner')
            .leftJoinAndSelect('conversation.store', 'store')
            .leftJoinAndSelect('store.city', 'city')
            .leftJoinAndSelect('store.district', 'district')
            .leftJoinAndSelect('store.ward', 'ward')
            .where(where, { ownerId: req.customer.id })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('conversation.updatedAt', 'DESC')
            .getManyAndCount();

        return res.sendOK({ conversations, total });
    }

    @Get('/pending')
    @UseAuth(VerificationJWT)
    @Summary('Ds tin nhắn chưa seen')
    async findAllUnSeen(
        @HeaderParams("token") token: string,
        @HeaderParams("version") version: string,
        @HeaderParams("device-id") deviceId: string,
        @QueryParams('type') type: 'OWNER' | 'TARGET' = 'OWNER',
        @QueryParams('storeId') storeId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const customerId = req.customer.id

        const subQuery = Conversation.createQueryBuilder('conversation')
            .select('conversationMessage.id', 'id')
            .leftJoin('conversation.owner', 'owner')
            .leftJoin('conversation.conversationMessages', 'conversationMessage')
            .innerJoin('conversationMessage.seenCustomers', 'seenCustomer', `seenCustomer.id = ${customerId}`)
            .where(`owner.id = ${customerId} AND conversationMessage.sendBy != ${escape(UserType.Customer)}`)

        let where = `conversation.isDeleted = false AND conversationMessage.sendBy != ${escape(UserType.Customer)} AND conversationMessage.id NOT IN (${subQuery.getQuery()})`;

        if (type == 'OWNER') {
            where += ` AND owner.id = ${customerId}`
        } else {
            where += ` AND target.id = ${customerId}`
        }

        if (storeId) {
            where += ` AND store.id = :storeId`
        }


        const query = ConversationMessage.createQueryBuilder('conversationMessage')
            .select('conversation.*')
            .addSelect('COUNT(*)', 'totalPending')
            .leftJoin('conversationMessage.conversation', 'conversation')
            .leftJoin('conversation.owner', 'owner')
            .leftJoin('conversation.target', 'target')
            .leftJoin('conversation.store', 'store')
            .leftJoin('conversationMessage.seenCustomers', 'seenCustomer')
            .where(where, {
                storeId
            })
            .groupBy('conversation.id')
            .orderBy('conversation.updatedAt', 'DESC')

        console.log('query pending message', query.getQuery());


        const conversations = await query.getRawMany();



        return res.sendOK({ conversations });
    }

    @Get('/:conversationId/messages')
    @UseAuth(VerificationJWT)
    @UseNamespace()
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
        const storeId = req.store.id
        let where = 'conversationMessage.isDeleted = 0 AND conversation.id = :conversationId'
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
            .leftJoinAndSelect('conversationMessage.sender', 'sender')
            .leftJoinAndSelect('conversationMessage.seenCustomers', 'seenCustomer', `seenCustomer.id = ${req.customer.id}`)
            .leftJoinAndSelect('conversationMessage.product', 'product')
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
            .where(where, { conversationId })
            .orderBy('conversationMessage.id', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount()

        return res.sendOK({ messages, total });
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Summary('Tạo hoặc get conversation (Nếu tồn tại)')
    @Validator({

    })
    async create(
        @HeaderParams("token") token: string,
        @HeaderParams('device-id') deviceId: string,
        @BodyParams('storeId') storeId: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const store = await Store.createQueryBuilder('store')
            .leftJoinAndSelect('store.customers', 'customers')
            .where('store.isDeleted = false AND store.id = :storeId AND customers.id = :customerId', { customerId: req.customer.id, storeId })
            .getOne()

        if (!store) {
            throw new BadRequest("Dữ liệu không hợp lệ.")
        }

        const conversation = await this.conversationService.createOrGetConversation({
            owner: req.customer,
            store
        })

        return res.sendOK(conversation)
    }


    @Patch('/:conversationMessageId/seen')
    @UseAuth(VerificationJWT)
    @Validator({
        conversationMessageId: Joi.number().required()
    })
    async seenMessage(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("conversationMessageId") conversationMessageId: number,
    ) {

        const conversationMessage = await ConversationMessage.findOneOrThrowId(conversationMessageId, {
            relations: ['seenCustomers', 'sender']
        }, '');

        if (!conversationMessage.sender || conversationMessage.sender.id == req.customer.id) {
            return res.sendOK({})
        }

        conversationMessage.seenCustomers.push(req.customer);
        await conversationMessage.save()
        res.sendOK({})
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
        const customerId = req.customer.id


        const subQuery = Conversation.createQueryBuilder('conversation')
            .select('conversationMessage.id', 'id')
            .leftJoin('conversation.owner', 'owner')
            .leftJoin('conversation.conversationMessages', 'conversationMessage')
            .innerJoin('conversationMessage.seenCustomers', 'seenCustomer', `seenCustomer.id = ${customerId}`)
            .where(`owner.id = ${customerId} AND conversationMessage.sendBy != ${escape(UserType.Customer)}`)

        let where = `conversation.isDeleted = false AND conversationMessage.sendBy != ${escape(UserType.Customer)} AND conversationMessage.id NOT IN (${subQuery.getQuery()})`;

        const conversationMessages = await ConversationMessage.createQueryBuilder('conversationMessage')
            .leftJoin('conversationMessage.conversation', 'conversation')
            .leftJoin('conversation.owner', 'owner')
            .leftJoin('conversation.target', 'target')
            .leftJoin('conversation.store', 'store')
            .leftJoinAndSelect('conversationMessage.seenCustomers', 'seenCustomer')
            .where(where, {})
            .getMany();

        for (const message of conversationMessages) {
            message.seenCustomers.push(req.customer)
        }

        await ConversationMessage.save(conversationMessages)


        res.sendOK({})
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
            customerSender: req.customer,
            conversationId,
            message,
            sendBy: UserType.Customer
        })

        return res.sendOK(message)
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
