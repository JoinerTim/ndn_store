import {
    Controller,
    UseAuth,
    Req,
    Get,
    Res,
    Response,
    HeaderParams,
    PathParams,
    Post,
    BodyParams,
    Patch,
} from "@tsed/common";
import Joi from "@hapi/joi";
import { Docs } from "@tsed/swagger";
import { Request } from "express";

import { Validator } from "../../middleware/validator/Validator";
import { VerificationJWT } from "../../middleware/auth/VerificationJWT";
import { Role } from "../../entity/Role";
import { RoleService } from "../../services/RoleService";
import { Permission } from "../../entity/Permission";
import { PermissionImport } from "../../entity-request/PermissionImport";
import { StorePermission } from "../../entity/StorePermission";
import { Employee } from "../../entity/Employee";
import { BadRequest } from "@tsed/exceptions";
import { BenefitPackage } from "../../entity/BenefitPackage";

@Controller("/store/role")
@Docs("docs_store")
export class RoleController {

    constructor(private roleService: RoleService) { }


    // =====================CREATE ITEM=====================
    @Post('/')
    @UseAuth(VerificationJWT)
    @Validator({
        role: Joi.required(),
        token: Joi.required()
    })
    async create(
        @BodyParams("role") role: Role,
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        role.store = req.store

        await role.save()
        return res.sendOK({ id: role.id })
    }



    // =====================GET LIST=====================
    @Get('/')
    @UseAuth(VerificationJWT)
    @Validator({
    })
    async findAll(
        @Res() res: Response,
        @Req() req: Request,
        @HeaderParams("token") token: string,
    ) {
        const roles = await Role.createQueryBuilder('role')
            .leftJoin('role.store', 'store')
            .where('store.id = :storeId', { storeId: req.store.id })
            .getMany()
        return res.sendOK(roles)
    }


    // =====================GET PERMISSION=====================
    @Get('/permissions')
    @UseAuth(VerificationJWT)
    @Validator({
        token: Joi.required()
    })
    async getAllPermission(
        @Res() res: Response,
        @Req() req: Request,
        @HeaderParams("token") token: string,
    ) {
        const store = req.store
        const employee = req.employee
        if (employee.isAdmin) {
            const benefitPackages = await BenefitPackage.createQueryBuilder('benefitPackages')
                .leftJoinAndSelect('benefitPackages.permissions', 'permissions')
                .leftJoin('benefitPackages.stores', 'stores')
                .andWhere('stores.id = :storeId', { storeId: store.id })
                .getOne()
            const permissions = benefitPackages?.permissions || []
            return res.sendOK(permissions)

        }
        else {

            const rolesAdmin = await Role.createQueryBuilder('role')
                .leftJoinAndSelect('role.store', 'store')
                .leftJoinAndSelect('role.permissions', 'permissions')
                .where('store.id = :storeId AND role.isAdmin = true AND role.isDeleted = false', { storeId: store.id })
                .getOne()


            let adminPermissions: Permission[] = []

            if (rolesAdmin) {
                adminPermissions = rolesAdmin.permissions
            }
            else {
                const benefitPackage = await BenefitPackage.createQueryBuilder('benefitPackage')
                    .leftJoinAndSelect('benefitPackage.permissions', 'permissions')
                    .leftJoinAndSelect('benefitPackage.stores', 'stores')
                    .where('stores.id = :storeId AND benefitPackage.isDeleted = false AND permissions.isDeleted = false', { storeId: store.id })
                    .getOne()

                const permissions = benefitPackage?.permissions || []

                await this.roleService.initRole('ADMIN', 'Quản lý tất cả chức năng', req.store, permissions, true)
                adminPermissions = permissions
            }

            const permissionIds = adminPermissions.map((item) => item.id) || []

            const benefitPackages = await BenefitPackage.createQueryBuilder('benefitPackages')
                .leftJoinAndSelect('benefitPackages.permissions', 'permissions')
                .innerJoin('permissions.roles', 'roles')
                .innerJoin('roles.employees', 'employees')
                .leftJoin('benefitPackages.stores', 'stores')
                .where('stores.id = :storeId AND employees.id = :employeeId', { storeId: store.id, employeeId: employee.id })
                .getOne()

            const permissions = benefitPackages?.permissions || []

            const permissionChange = permissions.filter((per) => {
                return permissionIds.includes(per.id)
            })

            return res.sendOK({ permissions: permissionChange })

        }




    }

    // =====================GET ITEM=====================
    @Get('/:roleId')
    @UseAuth(VerificationJWT)
    @Validator({
        roleId: Joi.number().required(),
        token: Joi.required()
    })
    async getRole(
        @PathParams("roleId") roleId: number,
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const storeId = req.store.id

        const roleFound = await Role.createQueryBuilder('role')
            .leftJoinAndSelect('role.store', 'store')
            .where('role.id = :roleId AND store.id = :storeId', { roleId, storeId })
            .getOne()

        if (!roleFound) {
            throw new BadRequest('Không tìm thấy role')
        }

        const rolesAdmin = await Role.createQueryBuilder('role')
            .leftJoinAndSelect('role.store', 'store')
            .leftJoinAndSelect('role.permissions', 'permissions')
            .where('store.id = :storeId AND role.isAdmin = true AND role.isDeleted = false', { storeId })
            .getOne()

        let adminPermissions: Permission[] = []

        if (rolesAdmin) {
            adminPermissions = rolesAdmin.permissions
        }
        else {
            const benefitPackage = await BenefitPackage.createQueryBuilder('benefitPackage')
                .leftJoinAndSelect('benefitPackage.permissions', 'permissions')
                .leftJoinAndSelect('benefitPackage.stores', 'stores')
                .where('stores.id = :storeId AND benefitPackage.isDeleted = false AND permissions.isDeleted = false', { storeId })
                .getOne()

            const permissions = benefitPackage?.permissions || []

            await this.roleService.initRole('ADMIN', 'Quản lý tất cả chức năng', req.store, permissions, true)
            adminPermissions = permissions
        }

        const permissionIds = adminPermissions.map((item) => item.id) || []

        const role = await Role.createQueryBuilder('role')
            .leftJoin('role.store', 'store')
            .leftJoinAndSelect('role.permissions', 'permissions')
            .where('role.id = :roleId AND store.id = :storeId', { roleId, storeId })
            .getOne()

        const permissionChange = role.permissions.filter((per) => {
            return permissionIds.includes(per.id)
        })

        role.permissions = permissionChange

        return res.sendOK(role)
    }


    // =====================UPDATE ROLE=====================
    @Patch('/:roleId')
    @UseAuth(VerificationJWT)
    @Validator({
        roleId: Joi.number().required(),
        permissionIds: Joi.required(),
    })
    async update(
        @HeaderParams("token") token: string,
        @Res() res: Response,
        @Req() req: Request,
        @PathParams("roleId") roleId: number,
        @BodyParams("permissionIds", Number) permissionIds: number[],
        @BodyParams("role") role: Role,
    ) {

        const store = req.store

        const oldRole = await Role.findOneOrThrowId(+roleId)
        role.id = +roleId


        if (permissionIds.length) {
            const benefitPackages = await BenefitPackage.createQueryBuilder('benefitPackages')
                .leftJoinAndSelect('benefitPackages.permissions', 'permissions')
                .leftJoin('benefitPackages.stores', 'stores')
                .where(`permissions.id IN (:...permissionIds)`, { permissionIds })
                .andWhere('stores.id = :storeId', { storeId: store.id })
                .getOne()

            role.permissions = benefitPackages?.permissions || []
        } else if (typeof permissionIds === 'object') {
            role.permissions = []
        }

        await role.save()

        return res.sendOK(role)
    }


    @Patch('/:roleId/admin')
    @UseAuth(VerificationJWT)
    @Validator({
        roleId: Joi.number().required()
    })
    async updateAdmin(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("roleId") roleId: number,
    ) {
        const role = await Role.createQueryBuilder('role')
            .leftJoinAndSelect('role.store', 'store')
            .where('role.id = :roleId AND store.id =:storeId', { roleId, storeId: req.store.id })
            .getOne()

        if (!role) {
            throw new BadRequest("Role không tìm thấy!")
        }

        await Role.update({ store: req.store }, { isAdmin: false })
        role.isAdmin = true

        await role.save()
        return res.sendOK(role)
    }


} // END FILE
