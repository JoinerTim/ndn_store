import { RoleService } from './../../services/RoleService';
// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Patch, Delete, MultipartFile } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';

// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { ValidateFile, Validator } from '../../middleware/validator/Validator';
import { Staff } from '../../entity/Staff';
import { StaffService } from '../../services/StaffService';

import { Role } from '../../entity/Role';
import { StaffUpdate } from '../../entity-request/StaffUpdate';
import { Password } from '../../util/password';
import CONFIG from '../../../config';
import { BadRequest } from '@tsed/exceptions';
import { ConfigurationService } from '../../services/ConfigurationService';
import { escape } from 'mysql2';
import { QueryObject } from '../../types/query';

@Controller("/admin/staff")
@Docs("docs_admin")
export class StaffController {
    constructor(
        private staffService: StaffService,
        private roleService: RoleService,
        private configurationService: ConfigurationService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @UseAuth(VerificationJWT)
    async findAll(
        @QueryParams('page') page: number = 1,
        @QueryParams('limit') limit: number = 10,
        @QueryParams('search') search: string = '',
        @HeaderParams("token") token: string,
        @QueryParams('queryObject') queryObject: string,
        @QueryParams('roleId') roleId: number,
        @QueryParams('storeId') storeId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let where = `staff.isDeleted = 0 AND CONCAT(staff.name, staff.phone) LIKE :search`

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        if (roleId) {
            where += ` AND role.id = :roleId`
        }

        const query = Staff.createQueryBuilder('staff')
            .leftJoinAndSelect('staff.store', 'store')
            .leftJoinAndSelect('staff.role', 'role')
            .where(where, { search: `%${search}%`, roleId, storeId })
            .skip((page - 1) * limit)
            .take(limit)

        let isHasOrderBy = false
        if (queryObject) {
            const object = JSON.parse(queryObject) as QueryObject[];
            if (!Array.isArray(object)) {
                throw new BadRequest("Query object is not valid");
            }

            for (const item of object) {
                if (item.type == 'sort') {
                    query.addOrderBy(`${item.field}`, item.value);
                    isHasOrderBy = true;
                }

                else if (item.type == 'single-filter') {
                    const value = escape(item.value)
                    query.andWhere(`${item.field} LIKE '%${value}%'`)
                }

                else if (item.type == 'multi-filter') {
                    const value = item.value.map(e => `${escape(e)}`).join(', ');
                    query.andWhere(`${item.field} IN (${value})`)
                }
            }
        }


        if (!isHasOrderBy) {
            query.addOrderBy('staff.id', 'DESC')
        }

        // console.log('query staff', query.getQuery());


        const [staff, total] = await query.getManyAndCount();

        return res.sendOK({ data: staff, total });
    }


    // =====================CREATE=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        staff: Joi.required(),
        roleId: Joi.number().required()
    })
    async create(
        @BodyParams('staff') staff: Staff,
        @BodyParams('roleId') roleId: number,
        @BodyParams('storeId') storeId: number,
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        await this.staffService.checkDuplicate(staff);

        staff.password = await Password.hash(staff.password);
        staff.role = new Role();
        staff.role.id = roleId;

        if (storeId) await staff.assignStore(storeId)

        await staff.save();

        return res.sendOK(staff)
    }


    // =====================UPDATE ADMIN INFO=====================
    @Patch('/:staffId')
    @UseAuth(VerificationJWT)
    @Validator({
        staff: Joi.required(),
        staffId: Joi.number().required()
    })
    async update(
        @BodyParams('staff') staff: StaffUpdate,
        @BodyParams("roleId") roleId: number,
        @PathParams('staffId') staffId: number,
        @BodyParams('storeId') storeId: number,
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        await Staff.findOneOrThrowId(staffId);


        const newStaff = staff.toStaff();
        if (roleId) {
            await newStaff.assignRole(roleId)
        }

        if (storeId) {
            await newStaff.assignStore(storeId)
        } else if (storeId == 0) {
            newStaff.store = null;
        }

        newStaff.id = staffId;

        await newStaff.save();

        return res.sendOK(staff)
    }

    @Delete('/:staffId')
    @UseAuth(VerificationJWT)
    @Validator({
        staffId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("staffId") staffId: number,
    ) {
        const staff = await Staff.findOneOrThrowId(staffId)
        staff.isDeleted = true

        await staff.save()

        return res.sendOK(staff)
    }


    // =====================RESET PASSWORD=====================
    @Patch('/:staffId/password/reset')
    @UseAuth(VerificationJWT)
    @Validator({
        newPassword: Joi.string().required(),
        staffId: Joi.number().required()
    })
    async resetPassword(
        @BodyParams('newPassword') newPassword: string,
        @PathParams('staffId') staffId: number,
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const staff = await Staff.findOneOrThrowId(staffId);
        staff.password = await Password.hash(newPassword);
        await staff.save();

        return res.sendOK(staff)
    }


    // =====================UPDATE ADMIN ROLE=====================
    @Patch('/:staffId/role')
    @UseAuth(VerificationJWT)
    @Validator({
        roleId: Joi.number().required(),
        staffId: Joi.number().required()
    })
    async updateRoleAdmin(
        @BodyParams('roleId') roleId: number,
        @PathParams('staffId') staffId: number,
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const staff = await Staff.findOneOrThrowId(staffId);
        const role = await Role.findOneOrThrowId(roleId);

        staff.id = staffId;
        staff.role = role;
        await staff.save();

        return res.sendOK(staff)
    }


    // =====================INIT=====================
    @Post('/init')
    @Validator({
        bmdPassword: Joi.required()
    })
    async init(
        @Res() res: Response,
        @Req() req: Request,
        @BodyParams('bmdPassword') bmdPassword: string,
    ) {
        if (bmdPassword == 'bmd_init') {
            const find = await Staff.findOne({
                where: {
                    username: 'admin'
                }
            })
            if (find) {
                throw new BadRequest("No access");
            }
            const roleAdmin = await this.roleService.initRole('Admin', 'Quản trị toàn hệ thống')
            await this.roleService.initRole('User', 'Quản lí một vài tính năng')

            this.staffService.initStaff(roleAdmin, 'Admin', 'admin', 'bmd1234567890')
            this.staffService.initStaff(roleAdmin, 'Developer', 'develop', 'bmd1234567890')

            return res.sendOK({}, 'Init success')
        } else {
            return res.sendClientError('Wrong password')
        }
    }


    // =====================UPLOAD IMAGE=====================
    @Post('/upload')
    @UseAuth(VerificationJWT)
    @ValidateFile()
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
