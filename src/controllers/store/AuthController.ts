// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams, Post, BodyParams, Patch } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Deprecated } from '@tsed/schema';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { StoreService } from '../../services/StoreService';
import { Store } from '../../entity/Store';
import { EmployeeService } from '../../services/EmployeeService';
import { BadRequest } from '@tsed/exceptions';
import { Employee } from '../../entity/Employee';
import { getIpAddress } from '../../util/helper';


@Controller("/store/auth")
@Docs("docs_store")
export class AuthController {
    constructor(
        private storeService: StoreService,
        private employeeService: EmployeeService
    ) { }


    @Get('/profile')
    @UseAuth(VerificationJWT)
    @Validator({

    })
    async getProfile(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const employeeData = await Employee.createQueryBuilder('employee')
            .leftJoinAndSelect('employee.role', 'role')
            .leftJoinAndSelect('employee.store', 'store')
            .leftJoinAndSelect('store.benefitPackage', 'benefitPackage')
            .leftJoinAndSelect('benefitPackage.stores', 'stores')
            .where('employee.id = :employeeId AND stores.id = :storeId', { employeeId: req.employee.id, storeId: req.store.id })
            .getOne()

        return res.sendOK(employeeData)
    }

    @Patch('/profile')
    @UseAuth(VerificationJWT)
    @Deprecated()
    @Validator({
    })
    async updateProfile(
        @HeaderParams("token") token: string,
        @BodyParams('store') store: Store,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        throw new BadRequest("Method is deprecated!");

        store.id = req.store.id;
        await store.save()

        return res.sendOK(store)
    }

    @Patch('/password/update')
    @UseAuth(VerificationJWT)
    @Validator({
        newPassword: Joi.required(),
        oldPassword: Joi.required()
    })
    async updatePassword(
        @HeaderParams("token") token: string,
        @BodyParams('oldPassword') oldPassword: string,
        @BodyParams('newPassword') newPassword: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        await this.employeeService.updatePassword(req.employee.id, oldPassword, newPassword)

        return res.sendOK({})
    }

    @Post('/login')
    @Validator({
        username: Joi.required(),
        password: Joi.required(),
        namespace: Joi.required()
    })
    async login(
        @HeaderParams('device-id') deviceId: string,
        @HeaderParams('device-name') deviceName: string,
        @BodyParams('username') username: string,
        @BodyParams('password') password: string,
        @BodyParams('namespace') namespace: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const ipAddress = getIpAddress(req)
        const token = await this.storeService.login(username, password, namespace, deviceId, deviceName, ipAddress);

        return res.sendOK({
            token
        })
    }

} // END FILE
