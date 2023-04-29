// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { SocialNetwork } from '../../entity/SocialNetwork';
import { SocialNetworkService } from '../../services/SocialNetworkService';

@Controller("/admin/socialNetwork")
@Docs("docs_admin")
export class SocialNetworkController {
    constructor(
        private socialNetworkService: SocialNetworkService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(0),
        limit: Joi.number().min(0)
    })
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 0,
        @QueryParams("search") search: string = "",
        @QueryParams('isVisible') isVisible: boolean,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { socialNetworks, total } = await this.socialNetworkService.getManyAndCount({
            limit,
            search,
            page,
            isVisible
        })

        return res.sendOK({ socialNetworks, total });
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        socialNetwork: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("socialNetwork") socialNetwork: SocialNetwork,
    ) {
        await socialNetwork.save()
        return res.sendOK(socialNetwork)
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:socialNetworkId')
    @UseAuth(VerificationJWT)
    @Validator({
        socialNetwork: Joi.required(),
        socialNetworkId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("socialNetwork") socialNetwork: SocialNetwork,
        @PathParams("socialNetworkId") socialNetworkId: number,
    ) {
        await SocialNetwork.findOneOrThrowId(socialNetworkId)
        socialNetwork.id = +socialNetworkId
        await socialNetwork.save()

        return res.sendOK(socialNetwork)
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:socialNetworkId')
    @UseAuth(VerificationJWT)
    @Validator({
        socialNetworkId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("socialNetworkId") socialNetworkId: number,
    ) {
        const socialNetwork = await SocialNetwork.findOneOrThrowId(socialNetworkId)
        socialNetwork.isDeleted = true;
        await socialNetwork.save()

        return res.sendOK(socialNetwork)
    }

} // END FILE
