import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, Post, BodyParams, Patch, Delete } from '@tsed/common';
import Joi, { number } from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';

import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Role } from '../../entity/Role';
import { RoleService } from '../../services/RoleService';
import { Permission } from '../../entity/Permission';
import { PermissionImport } from '../../entity-request/PermissionImport';
import { In } from 'typeorm';

@Controller("/admin/role")
@Docs("docs_admin")
export class RoleController {
    constructor(
        private roleService: RoleService
    ) { }


    // =====================CREATE ITEM=====================
    @Post('')
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
        await role.save()

        return res.sendOK({ id: role.id })
    }


    // =====================GET LIST=====================
    @Get('')
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
            .where('role.isDeleted = false AND store.id is null')
            .getMany()

        return res.sendOK(roles)
    }


    // =====================IMPORT PERMISSIONS=====================
    @Post('/permissions/import')
    @UseAuth(VerificationJWT)
    @Validator({
        permissions: Joi.required(),
        token: Joi.required()
    })
    async importPermission(
        @BodyParams("permissions", PermissionImport) importPermissions: PermissionImport[],
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const permissions = importPermissions.map(e => e.toPermission())
        await Permission.save(permissions)

        return res.sendOK(permissions)
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
        const permissions = await Permission.createQueryBuilder('permission')
            .where('permission.isDeleted = false')
            .getMany()

        return res.sendOK(permissions)
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
        const role = await Role.findOne(roleId, {
            relations: ["permissions"]
        })

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
        await Role.findOneOrThrowId(+roleId)

        const permissions = await Permission.createQueryBuilder('permission')
            .where(`permission.id IN (:...permissionIds)`, { permissionIds })
            .getMany()

        role.id = +roleId
        role.permissions = permissions
        await role.save()

        return res.sendOK(role)
    }

    @Delete('/deletePermissions')
    async delete(
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('permissionIds', Number) permissionIds: number[]
    ) {

        await Permission.update({ id: In(permissionIds) }, { isDeleted: true })

        return res.sendOK({})
    }




} // END FILE
