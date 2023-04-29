// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { CustomerRank } from '../../entity/CustomerRank';
import { CustomerRankService } from '../../services/CustomerRankService';
import { Customer } from '../../entity/Customer';
import { BadRequest } from '@tsed/exceptions';

@Controller("/store/customerRank")
@Docs("docs_store")
export class CustomerRankController {
    constructor(
        private customerRankService: CustomerRankService
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
        const { customerRanks, total } = await this.customerRankService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id
        })

        return res.sendOK({ customerRanks, total });
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        customerRank: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("customerRank") customerRank: CustomerRank,
    ) {
        customerRank.store = req.store;
        await customerRank.save()
        return res.sendOK(customerRank)
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:customerRankId')
    @UseAuth(VerificationJWT)
    @Validator({
        customerRank: Joi.required(),
        customerRankId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("customerRank") customerRank: CustomerRank,
        @PathParams("customerRankId") customerRankId: number,
    ) {
        await CustomerRank.findOneOrThrowId(customerRankId, {
            where: {
                store: req.store
            }
        })
        customerRank.id = +customerRankId;
        await customerRank.save()

        return res.sendOK(customerRank)
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:customerRankId')
    @UseAuth(VerificationJWT)
    @Validator({
        customerRankId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("customerRankId") customerRankId: number,
    ) {
        const customerRank = await CustomerRank.findOneOrThrowId(customerRankId, {
            where: {
                store: req.store
            }
        })

        const customer = await Customer.findOne({
            where: {
                customerRank
            }
        })

        if (customer) {
            throw new BadRequest("Có khách hàng đang sở hữu thứ hạng này. Không thể xóa!");

        }
        await customerRank.delete()

        return res.sendOK(customerRank)
    }

} // END FILE
