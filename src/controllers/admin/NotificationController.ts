// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams, Post, BodyParams, Patch, Delete } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Enum } from '@tsed/schema';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Notification, NotificationFrom, NotificationMode, NotificationType } from '../../entity/Notification';
import { NotificationService } from '../../services/NotificationService';
import { Customer } from '../../entity/Customer';



@Controller("/admin/notification")
@Docs("docs_admin")
export class NotificationController {
    constructor(
        private notificationService: NotificationService
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
        @QueryParams('type') @Enum(NotificationType) type: NotificationType,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { notifications, total } = await this.notificationService.getManyAndCount({
            limit,
            search,
            page,
            type,
            from: NotificationFrom.Admin
        })

        for (const notification of notifications) {
            notification.isRead = !!notification.viewedCustomers?.length
        }

        return res.sendOK({ notifications, total });
    }


    // =====================CREATE ITEM=====================
    @Post('/create')
    @UseAuth(VerificationJWT)
    @Validator({
        notification: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("notification") notification: Notification,
        @BodyParams("orderId") orderId: number,
        @BodyParams("newsId") newsId: number,
        @BodyParams("productId") productId: number,

    ) {
        const from = NotificationFrom.Admin
        const data = await this.notificationService.createOrUpdate({ notification, orderId, newsId, productId, store: req.store, from })
        return res.sendOK(data)
    }



    // =====================UPDATE ITEM=====================
    @Patch('/:notificationId')
    @UseAuth(VerificationJWT)
    @Validator({
        notification: Joi.required(),
        notificationId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("notification") notification: Notification,
        @PathParams("notificationId") notificationId: number,
        @BodyParams("orderId") orderId: number,
        @BodyParams("newsId") newsId: number,
        @BodyParams("productId") productId: number,
    ) {
        const from = NotificationFrom.Admin
        const data = await this.notificationService.createOrUpdate({ notification, orderId, newsId, productId, store: req.store, notificationId, from })
        return res.sendOK(data)
    }


    // =====================PUSH NOTIFICATION=====================
    @Post('/:notificationId/push')
    @UseAuth(VerificationJWT)
    async pushNotification(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("notificationId") notificationId: number,
    ) {
        await this.notificationService.sendNotifications(notificationId, req.staff, undefined, NotificationFrom.Admin)
        return res.sendOK({})
    }



    // =====================UPDATE ITEM=====================
    @Delete('/:notificationId')
    @UseAuth(VerificationJWT)
    @Validator({
        notificationId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("notificationId") notificationId: number,
    ) {
        const notification = await Notification.findOneOrThrowId(notificationId)
        notification.isDeleted = true

        await notification.save()

        return res.sendOK(notification)
    }

}