import { Controller, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Patch, Post, Delete } from '@tsed/common';
import Joi from "@hapi/joi";
import { Docs } from "@tsed/swagger";

import { Validator } from "../../middleware/validator/Validator";
import { VerificationJWT } from "../../middleware/auth/VerificationJWT";
import { RoleService } from "../../services/RoleService";
import { BenefitPackageOrder } from '../../entity/BenefitPackageOrder';

@Controller("/admin/benefitPackageOrder")
@Docs("docs_admin")
export class BenefitPackageOrderController {
    constructor(private roleService: RoleService) { }

    @Get('/')
    @UseAuth(VerificationJWT)
    async getAll(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const benefitPackageDetails = await BenefitPackageOrder.find({ relations: ["store", "benefitPackage"] })
        return res.sendOK({ benefitPackageDetails })
    }


    @Get('/:storeId')
    @UseAuth(VerificationJWT)
    @Validator({
        storeId: Joi.required()
    })
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('storeId') storeId: number
    ) {

        const benefitPackageOrder = await BenefitPackageOrder.createQueryBuilder('benefitPackageOrder')
            .leftJoinAndSelect('benefitPackageOrder.store', 'store')
            .leftJoinAndSelect('benefitPackageOrder.benefitPackage', 'benefitPackage')
            .where('store.id = :storeId', { storeId })
            .getMany()
        return res.sendOK(benefitPackageOrder)

    }

} // END FILE
