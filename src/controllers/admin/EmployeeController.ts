// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Employee } from '../../entity/Employee';
import { EmployeeService } from '../../services/EmployeeService';
import { EmployeeInsert } from '../../entity-request/EmployeeInsert';
import { EmployeeUpdate } from '../../entity-request/EmployeeUpdate';
import { BadRequest } from '@tsed/exceptions';

@Controller("/admin/employee")
@Docs("docs_admin")
export class EmployeeController {
    constructor(
        private employeeService: EmployeeService
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
        @QueryParams('storeId') storeId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { employees, total } = await this.employeeService.getManyAndCount({
            limit,
            search,
            page,
            storeId
        })

        return res.sendOK({ employees, total });
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        employee: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("employee") employeeInsert: EmployeeInsert,
        @BodyParams('storeId') storeId: number,
    ) {
        const employee = await employeeInsert.toEmployee();

        await employee.assignStore(storeId);

        await this.employeeService.validate(employee, storeId, null)
        await employee.save()
        return res.sendOK(employee)
    }

    @Patch('/:employeeId/block')
    @UseAuth(VerificationJWT)
    @Validator({
        isBlocked: Joi.required()
    })
    async updateBlock(
        @HeaderParams("token") token: string,
        @PathParams("employeeId") employeeId: number,
        @BodyParams('isBlocked') isBlocked: boolean,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const employee = await Employee.findOneOrThrowId(employeeId, null, '')
        employee.isBlocked = isBlocked
        await employee.save()

        return res.sendOK({})
    }

    // =====================UPDATE ITEM=====================
    @Patch('/:employeeId')
    @UseAuth(VerificationJWT)
    @Validator({
        employee: Joi.required(),
        employeeId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("employee") employeeUpdate: EmployeeUpdate,
        @PathParams("employeeId") employeeId: number,
    ) {
        const employee = await employeeUpdate.toEmployee();
        const existEmployee = await Employee.findOneOrThrowId(employeeId, {
            relations: ['store']
        })

        await this.employeeService.validate(employee, existEmployee.store.id, employeeId)
        employee.id = +employeeId
        await employee.save()

        return res.sendOK(employee)
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:employeeId')
    @UseAuth(VerificationJWT)
    @Validator({
        employeeId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("employeeId") employeeId: number,
    ) {
        const employee = await Employee.findOneOrThrowId(employeeId);

        if (employee.isAdmin) {
            throw new BadRequest("Không thể xóa tài khoản admin.");
        }
        await employee.delete()

        return res.sendOK(employee)
    }

} // END FILE
