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
import { UseNamespace } from "../../middleware/auth/UseNamespace";

@Controller("/customer/role")
@Docs("docs_customer")
export class RoleController {

    constructor(private roleService: RoleService) { }

    // =====================GET PERMISSION=====================
    @Get('/permissions')
    @UseNamespace()
    async getAllPermission(
        @Res() res: Response,
        @Req() req: Request,
    ) {

        const storeId = req.store.id

        const benefitPackage = await BenefitPackage.createQueryBuilder('benefitPackage')
            .leftJoinAndSelect('benefitPackage.permissions', 'permissions')
            .leftJoinAndSelect('benefitPackage.stores', 'stores')
            .where('stores.id = :storeId AND benefitPackage.isDeleted = false AND permissions.isDeleted = false', { storeId })
            .getOne()

        const permissions = benefitPackage?.permissions


        return res.sendOK({ permissions })
    }



} // END FILE
