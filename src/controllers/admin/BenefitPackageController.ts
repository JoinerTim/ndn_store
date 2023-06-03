import { Controller, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Patch, Post, Delete } from '@tsed/common';
import Joi from "@hapi/joi";
import { Docs } from "@tsed/swagger";

import { Validator } from "../../middleware/validator/Validator";
import { VerificationJWT } from "../../middleware/auth/VerificationJWT";
import { Role } from "../../entity/Role";
import { RoleService } from "../../services/RoleService";
import { Permission } from "../../entity/Permission";
import { PermissionImport } from "../../entity-request/PermissionImport";
import { StorePermission } from "../../entity/StorePermission";
import { Employee } from "../../entity/Employee";
import { BadRequest } from "@tsed/exceptions";
import { BenefitPackage } from '../../entity/BenefitPackage';
import { In } from 'typeorm';
import { Store } from '../../entity/Store';

@Controller("/admin/benefitPackage")
@Docs("docs_admin")
export class BenefitPackageController {
    constructor(private roleService: RoleService) { }

    @Get('/')
    @UseAuth(VerificationJWT)
    async getAll(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const benefitPackages = await BenefitPackage.find({ relations: ["permissions"] })
        return res.sendOK({ benefitPackages })
    }


    @Get('/:benefitPackageId')
    @UseAuth(VerificationJWT)
    @Validator({
        benefitPackageId: Joi.required()
    })
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('benefitPackageId') benefitPackageId: number
    ) {

        const benefitPackage = await BenefitPackage.findOneOrThrowOption({ relations: ["permissions"], where: { id: benefitPackageId, isDeleted: false } })
        return res.sendOK(benefitPackage)

    }

    @Post('/')
    @UseAuth(VerificationJWT)
    @Validator({
        benefitPackage: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("benefitPackage") benefitPackage: BenefitPackage,
    ) {

        const benefitPackageFound = await BenefitPackage.createQueryBuilder('benefitPackage')
            .where('benefitPackage.name = :name AND benefitPackage.isDeleted = false', { name: benefitPackage.name })
            .getOne()

        if (benefitPackageFound) {
            throw new BadRequest(`Đã tồn tại gói ${benefitPackage.name}`)
        }

        await benefitPackage.save();

        return res.sendOK(benefitPackage)
    }


    @Patch('/:benefitPackageId')
    @UseAuth(VerificationJWT)
    @Validator({
        benefitPackages: Joi.required(),
        benefitPackageId: Joi.required()
    })
    async update(
        @HeaderParams("token") token: string,
        @BodyParams("benefitPackages") benefitPackage: BenefitPackage,
        @PathParams('benefitPackageId') benefitPackageId: number,
        @BodyParams("permissionIds", Number) permissionIds: number[],
        @Req() req: Request,
        @Res() res: Response,
    ) {

        await BenefitPackage.findOneOrThrowId(+benefitPackageId)

        // if (permissionIds.length) {
        //     const permissions = await Permission.createQueryBuilder('permission')
        //         .where(`permission.id IN (:...permissionIds)`, { permissionIds })
        //         .getMany()

        //     benefitPackage.permissions = permissions
        // }
        const permissions = await Permission.find({})
        benefitPackage.permissions = permissions

        benefitPackage.id = +benefitPackageId

        await benefitPackage.save();
        return res.sendOK(benefitPackage)

    }


    @Delete('/:benefitPackageId')
    @UseAuth(VerificationJWT)
    @Validator({
        benefitPackageId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("benefitPackageId") benefitPackageId: number,
    ) {
        const benefitPackage = await BenefitPackage.findOneOrThrowId(benefitPackageId)
        benefitPackage.isDeleted = true

        await benefitPackage.save()

        return res.sendOK({})
    }


    @Patch('/:benefitPackageId/default')
    @UseAuth(VerificationJWT)
    @Validator({
        benefitPackageId: Joi.number().required()
    })
    async updateDefault(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("benefitPackageId") benefitPackageId: number,
    ) {
        const benefitPackage = await BenefitPackage.findOneOrThrowId(benefitPackageId)

        await BenefitPackage.update({}, { isDefault: false })

        benefitPackage.isDefault = true
        await benefitPackage.save()
        return res.sendOK({})
    }
} // END FILE
