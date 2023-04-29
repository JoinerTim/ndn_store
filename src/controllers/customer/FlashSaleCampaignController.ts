// IMPORT LIBRARY
import { Controller, Req, Request, Res, Response, HeaderParams, Get, QueryParams } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { FlashSaleCampaignService } from '../../services/FlashSaleCampaignService';
import { CustomerService } from '../../services/CustomerService';
import { UseAuthHash } from '../../middleware/auth/UseAuthHash';
import { UseNamespace } from '../../middleware/auth/UseNamespace';

@Controller("/customer/flashSaleCampaign")
@Docs("docs_customer")
export class FlashSaleCampaignController {
    constructor(
        private flashSaleCampaignService: FlashSaleCampaignService,
        private customerService: CustomerService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @UseNamespace()
    @Validator({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100)
    })
    @UseAuthHash()
    async findAll(
        @HeaderParams("token") token: string,
        @HeaderParams("is-dev") isDev: boolean,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams("search") search: string = "",
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (token) {
            const customer = await this.customerService.getInfoByJwt(token)
            req.customer = customer;
        }

        const storeId = req.store.id;

        const { flashSaleCampaigns, total } = await this.flashSaleCampaignService.getManyAndCount({
            limit,
            search,
            page,
            dateType: 'current',
            customerId: req.customer?.id,
            storeId
        })

        return res.sendOK({ flashSaleCampaigns, total });
    }
} // END FILE
