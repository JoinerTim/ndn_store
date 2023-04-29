import { Request } from 'express';
import jwt from 'jsonwebtoken';

import AuthStrategy from './AuthStrategy';
import { Staff } from '../../../entity/Staff';
import { Customer } from '../../../entity/Customer';
import logger from '../../../util/logger';
import CONFIG from '../../../../config';
import { getCurrentTimeInt } from '../../../util/helper';
import { Unauthorized } from '@tsed/exceptions';
import { Employee } from '../../../entity/Employee';

export enum AuthType {
    Staff = "ADMIN",
    Customer = "CUSTOMER",
    Store = 'STORE'
}

export interface JWTSignedData {
    id: number,
    storeId?: number;
    type: AuthType,
    namespace?: string
    ia?: number
}

interface RequestHeaders {
    token?: string,
    hash?: string
    time?: number
}

export default class JWT implements AuthStrategy {

    public async auth(req: Request): Promise<any> {
        const { originalUrl: baseUrl } = req

        if (this.checkRouter(baseUrl, AuthType.Staff)) {
            return await this.authenticateStaff(req)
        }

        if (this.checkRouter(baseUrl, AuthType.Store)) {
            return await this.authenticateEmployee(req)
        }

        return await this.authenticateCustomer(req)
    }


    private checkRouter(baseUrl: string, type: AuthType) {
        return baseUrl.includes(`${CONFIG.PREFIX_URL}/${type.toLowerCase()}`);
    }


    public async authenticateCustomer(req: Request) {
        const { token } = <RequestHeaders>req.headers;

        const customerId = this.getAuthId(token, AuthType.Customer)

        const customer = await Customer.createQueryBuilder('customer')
            .leftJoinAndSelect('customer.store', 'store')
            .where('customer.id = :customerId AND store.isDeleted = 0 AND customer.isDeleted = false', {
                customerId
            })
            .getOne()

        if (!customer) {
            throw new Unauthorized("Tài khoản không tồn tại");
        }

        if (customer.isBlocked) {
            throw new Unauthorized("Tài khoản đã bị khóa!")
        }

        req.customer = customer;
        req.authType = AuthType.Customer
    }

    private async authenticateEmployee(req: Request) {
        const { token } = req.headers

        const employeeId = this.getAuthId(token, AuthType.Store);
        const employee = await Employee.createQueryBuilder('employee')
            .leftJoinAndSelect('employee.store', 'store')
            .where('employee.id = :employeeId AND store.isDeleted = 0 AND employee.isDeleted = 0', {
                employeeId
            })
            .getOne();

        if (!employee) {
            throw new Unauthorized("Tài khoản không tồn tại!");
        }

        if (employee.isBlocked) {
            throw new Unauthorized("Tài khoản đã bị khóa!")
        }

        req.employee = employee;
        req.store = employee.store;
        req.authType = AuthType.Store
    }



    private async authenticateStaff(req: Request) {
        const { token } = req.headers

        const staffId = this.getAuthId(token, AuthType.Staff);
        const staff = await Staff.findOne(staffId, {
            where: {
                isDeleted: false
            }
        });

        if (!staff) {
            throw new Unauthorized("Tài khoản không tồn tại!");
        }

        if (staff.isBlocked) {
            throw new Unauthorized("Tài khoản đã bị khóa!")
        }

        req.staff = staff;
        req.authType = AuthType.Staff
    }


    public getAuthId(token: any, type: AuthType): number {
        if (!token) {
            throw new Unauthorized("Unauthorized!")
        }

        try {
            const decoded = <JWTSignedData>jwt.verify(token, CONFIG.JWT_SECRET)
            if (decoded.id && decoded.type == type) {
                return decoded.id
            } else {
                throw new Unauthorized("Unauthorized!")
            }
        } catch (error) {
            logger('error').error('Error Get Authenticate ID: ', JSON.stringify(error))
            throw new Unauthorized("Unauthorized!")
        }
    }


    static getIa(token: string): number {
        if (!token) {
            return 0
        }

        try {
            const decoded = <JWTSignedData>jwt.verify(token, CONFIG.JWT_SECRET)
            return decoded.ia
        } catch (error) {
            return 0
        }
    }


    static sign(data: JWTSignedData): string {
        data = { ...data, ia: getCurrentTimeInt() }
        return jwt.sign(data, CONFIG.JWT_SECRET, { expiresIn: CONFIG.JWT_EXPIRE })
    }

}
