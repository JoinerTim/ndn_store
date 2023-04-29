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
import { Employee } from '../../entity/Employee';
import { UseAuthHash } from '../../middleware/auth/UseAuthHash';
import { escape } from 'mysql2';



@Controller("/store/notificationStore")
@Docs("docs_store")
export class NotificationStoreController {
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
        @QueryParams("isAdmin") isAdmin: boolean = false,
        @QueryParams('type') @Enum(NotificationType) type: NotificationType,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const employeeId = req.employee.id
        const storeId = req.store.id
        const { notifications, total } = await this.notificationService.getManyAndCount({
            limit,
            search,
            page,
            type,
            from: NotificationFrom.Admin,
            employeeId,
            isAdmin,
            storeId
        })

        for (const notification of notifications) {
            notification.isRead = !!notification.viewedEmployees?.length
        }

        return res.sendOK({ notifications, total });
    }


    @Get('/total/un-read')
    @UseAuth(VerificationJWT)
    @Validator({
    })
    async getTotalUnread(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const total = await this.notificationService.getTotalUnReadNotification(undefined, req.store, req.employee.id, NotificationFrom.Admin);
        req.employee.notificationBadgeCount = total;
        req.employee.save();

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
            .leftJoinAndSelect('notification.viewedEmployees', 'viewedEmployee')
            .where('notification.id = :notificationId', { notificationId })
            .getOne()

        //Đã có r
        if (notification.viewedEmployees.some(e => e.id == req.employee.id)) {
            return res.sendOK({})
        }

        notification.viewedEmployees.push(req.employee);
        await notification.save();

        req.employee.notificationBadgeCount--;
        if (req.employee.notificationBadgeCount < 0) {
            req.employee.notificationBadgeCount = 0;
            req.employee.save()
        }

        await req.employee.save();

        res.sendOK({})
    }

    @Post('/read-all')
    @UseAuth(VerificationJWT)
    async markReadAll(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const employee = await Employee.findOneOrThrowId(req.employee.id, {
            relations: ['viewedNotifications']
        }, '')

        let where = `notification.isDeleted = 0 AND store.id = :storeId`;

        const query = Notification.createQueryBuilder('notification')
            .leftJoin('notification.store', 'store')
            .leftJoin('notification.assignedEmployees', 'employee', `employee.id = ${employee.id}`)
            .where(where, {
                storeId: req.store.id
            })
            .orWhere(`notification.from = "${NotificationFrom.Admin}"`)


        const notifications = await query
            .getMany()

        employee.viewedNotifications = [...notifications];
        employee.notificationBadgeCount = 0;
        await employee.save();
        res.sendOK({})

    }

    @Get('/summary/total')
    @UseAuth(VerificationJWT)
    async getSummaryTotal(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const storeId = req.store.id
        let where = `notification.isDeleted = 0 `;

        const notificationAdmin = await Notification.createQueryBuilder('notification')
            .select('notification.from', 'name')
            .addSelect('COUNT(*)', 'total')
            .groupBy('notification.from ')
            .where(where + ` AND (notification.from = ${escape(NotificationFrom.Admin)})`, {})
            .getRawMany()

        const noticationOrder = await Notification.createQueryBuilder('notification')
            .select('notification.type', 'name')
            .addSelect('COUNT(*)', 'total')
            .leftJoin('notification.store', 'store')
            .groupBy('notification.type ')
            .where(where + ` AND notification.type = ${escape(NotificationType.Order)} AND notification.from = ${escape(NotificationFrom.Customer)} AND store.id = :storeId`, { storeId })
            .getRawMany()

        const notificationRate = await Notification.createQueryBuilder('notification')
            .select('notification.type', 'name')
            .addSelect('COUNT(*)', 'total')
            .leftJoin('notification.store', 'store')
            .groupBy('notification.type ')
            .where(where + ` AND notification.type = ${escape(NotificationType.Product)} AND notification.from = ${escape(NotificationFrom.Customer)} AND store.id = :storeId`, { storeId })
            .getRawMany()

        const notificationSummary = [...notificationAdmin, ...noticationOrder, ...notificationRate]

        return res.sendOK(notificationSummary)
    }

}