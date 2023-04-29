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
import { Role } from '../../entity/Role';

@Controller("/store/employee")
@Docs("docs_store")
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
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { employees, total } = await this.employeeService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id
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
        @BodyParams("roleId") roleId: number,

    ) {
        const storeId = req.store.id

        const employee = await employeeInsert.toEmployee();

        if (roleId) {
            const role = await Role.createQueryBuilder('role')
                .leftJoinAndSelect('role.store', 'store')
                .where('store.id = :storeId AND role.id = :roleId', { storeId, roleId })
                .getOne()

            if (!role) {
                throw new BadRequest("Không tồn tại role")
            }

            await employee.assignRole(roleId)
        }


        await this.employeeService.validate(employee, req.store.id, null)

        await employee.assignStore(req.store.id)

        await employee.save()
        return res.sendOK(employee)
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
        @BodyParams("roleId") roleId: number,
    ) {
        const storeId = req.store.id

        const oldEmployee = await Employee.findOneOrThrowId(employeeId);

        const employee = await employeeUpdate.toEmployee();

        if (roleId) {
            const role = await Role.createQueryBuilder('role')
                .leftJoinAndSelect('role.store', 'store')
                .where('store.id = :storeId AND role.id = :roleId', { storeId, roleId })
                .getOne()

            if (!role) {
                throw new BadRequest("Không tồn tại role")
            }

            if (oldEmployee.isAdmin && !role.isAdmin) {
                throw new BadRequest("Tài khoản ADMIN không cập nhật được quyền mới.")
            }

            await employee.assignRole(roleId)
        }

        await this.employeeService.validate(employee, req.store.id, employeeId)
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
        const employee = await Employee.findOneOrThrowId(employeeId)

        if (employee.isAdmin) {
            throw new BadRequest("Không thể xóa tài khoản admin.");
        }

        await employee.delete()

        return res.sendOK(employee)
    }

} // END FILE
