// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams, Post, BodyParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { UseAuthHash } from '../../middleware/auth/UseAuthHash';
import { ZaloUtil } from '../../util/ZaloUtil';


@Controller("/customer/zalo")
@Docs("docs_customer")
export class ZaloController {
    constructor(

    ) { }


    // =====================GET LIST=====================
    @Post('/profile')
    @UseAuthHash()
    @Validator({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100)
    })
    async getProfile(
        @BodyParams('accessToken') accessToken: string,
        @BodyParams('token') token: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const data = await ZaloUtil.getUserProfile(accessToken, token)

        return res.sendOK(data);
    }

} // END FILE
