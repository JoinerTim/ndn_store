// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { SocialNetworkService } from '../../services/SocialNetworkService';

@Controller("/customer/socialNetwork")
@Docs("docs_customer")
export class SocialNetworkController {
    constructor(
        private socialNetworkService: SocialNetworkService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    async findAll(
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { socialNetworks, total } = await this.socialNetworkService.getManyAndCount({
            isVisible: true,
            limit: 0,
            page: 1
        })

        return res.sendOK({ socialNetworks, total });
    }

} // END FILE
