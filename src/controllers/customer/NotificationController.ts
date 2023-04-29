// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams, Post } from '@tsed/common';
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
import { UseNamespace } from '../../middleware/auth/UseNamespace';



@Controller("/customer/notification")
@Docs("docs_customer")
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
    @UseNamespace()
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
            customerId: req.customer.id,
            storeId: req.store.id,
            type,
            sortBy: 'notification.lastSentAt'
        })

        for (const notification of notifications) {
            notification.isRead = !!notification.viewedCustomers?.length
        }

        return res.sendOK({ notifications, total });
    }

    @Get('/total/un-read')
    @UseAuth(VerificationJWT)
    @UseNamespace()
    @Validator({
    })
    async getTotalUnread(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const total = await this.notificationService.getTotalUnReadNotification(req.customer.id, req.store);
        req.customer.notificationBadgeCount = total;
        req.customer.save();

        return res.sendOK({
            total
        })
    }

    @Get('/:notificationId')
    @UseAuth(VerificationJWT)
    @Validator({
        notificationId: Joi.required()
    })
    async getOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('notificationId') notificationId: number
    ) {
        const notification = await this.notificationService.getOne(notificationId);
        return res.sendOK(notification)
    }

    @Post('/:notificationId/read')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0)
    })
    async markRead(
        @HeaderParams("token") token: string,
        @PathParams('notificationId') notificationId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {

        const notification = await Notification.createQueryBuilder('notification')
            .leftJoinAndSelect('notification.viewedCustomers', 'viewedCustomer')
            .where('notification.id = :notificationId', { notificationId })
            .getOne()

        //Đã có r
        if (notification.viewedCustomers.some(e => e.id == req.customer.id)) {
            return res.sendOK({})
        }

        notification.viewedCustomers.push(req.customer);
        await notification.save();

        req.customer.notificationBadgeCount--;
        if (req.customer.notificationBadgeCount < 0) {
            req.customer.notificationBadgeCount = 0;
            req.customer.save()
        }

        await req.customer.save();

        res.sendOK({})
    }

    @Post('/read-all')
    @UseAuth(VerificationJWT)
    @UseNamespace()
    async markReadAll(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const customer = await Customer.findOneOrThrowId(req.customer.id, {
            relations: ['viewedNotifications']
        }, '')

        let where = `notification.isDeleted = 0 AND store.id = :storeId AND (notification.mode = "${NotificationMode.Group}" OR (notification.from  = "${NotificationFrom.Store}"))`;

        const query = Notification.createQueryBuilder('notification')
            .leftJoin('notification.store', 'store')
            .leftJoin('notification.assignedCustomers', 'customer', `customer.id = ${customer.id}`)
            .where(where, {
                storeId: req.store.id
            })


        const notifications = await query
            .getMany()

        customer.viewedNotifications = [...notifications];
        customer.notificationBadgeCount = 0;
        await customer.save();
        res.sendOK({})

    }

} // END FILE
