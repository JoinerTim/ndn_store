// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams, Post, BodyParams, Delete } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { OneSignal } from '../../entity/OneSignal';

@Controller("/customer/oneSignal")
@Docs("docs_customer")
export class OneSignalController {
    constructor(
    ) { }


    // =====================GET LIST=====================
    @Post('/sub')
    @UseAuth(VerificationJWT)
    @Validator({
        oneSignalId: Joi.required()
    })
    async sub(
        @HeaderParams("token") token: string,
        @BodyParams('oneSignalId') oneSignalId: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let oneSignal = await OneSignal.findOne({
            where: {
                oneSignalId
            }
        });

        if (!oneSignal) {
            oneSignal = new OneSignal()
        }
        oneSignal.oneSignalId = oneSignalId;
        oneSignal.customer = req.customer;
        await oneSignal.save()

        return res.sendOK({});
    }

    @Delete('/unSub')
    @UseAuth(VerificationJWT)
    @Validator({
        oneSignalId: Joi.required()
    })
    async unSub(
        @HeaderParams("token") token: string,
        @BodyParams('oneSignalId') oneSignalId: string,
        @Req() req: Request,
        @Res() res: Response
    ) {
        let oneSignal = await OneSignal.findOne({
            where: {
                oneSignalId
            }
        });

        if (oneSignal) {
            await OneSignal.delete(oneSignal.id);
        }


        return res.sendOK({});
    }

} // END FILE
