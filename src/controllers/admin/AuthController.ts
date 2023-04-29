// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, Post, BodyParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { StaffService } from '../../services/StaffService';
import JWT, { AuthType } from '../../middleware/auth/strategy/JWT';
import { Staff } from '../../entity/Staff';
import { Mailer } from '../../util/mailer';
import { spawnSync } from 'child_process';


@Controller("/admin/auth")
@Docs("docs_admin")
export class AuthController {
    constructor(
        private staffService: StaffService,
    ) { }


    // =====================LOGIN=====================
    @Post('/login')
    @Validator({
        username: Joi.string().required(),
        password: Joi.string().required()
    })
    async login(
        @BodyParams('username') username: string,
        @BodyParams('password') password: string,
        @Res() res: Response,
        @Req() req: Request,
    ) {
        const staff = await this.staffService.login(username, password);
        const token = JWT.sign({ id: staff.id, type: AuthType.Staff });

        return res.sendOK({ token })
    }


    // =====================PROFILE=====================
    @Get('/profile')
    @UseAuth(VerificationJWT)
    async getInfo(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
    ) {
        const staff = await Staff.findOneOrThrowId(req.staff.id, {
            relations: ['role.permissions', 'role', 'store']
        });

        return res.sendOK(staff)
    }


    // =====================UPDATE PASSWORD=====================
    @Post('/password/update')
    @UseAuth(VerificationJWT)
    @Validator({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().required()
    })
    async changePassword(
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('oldPassword') oldPassword: string,
        @BodyParams('newPassword') newPassword: string,
        @HeaderParams("token") token: string,
    ) {
        const { staff } = req;

        await this.staffService.changePassword({ staff, oldPassword, newPassword })

        return res.sendOK(staff, 'Cập nhật mật khẩu thành công');
    }


    // =====================GET PERMISSION=====================
    @Get('/profile/permission')
    @UseAuth(VerificationJWT)
    async getPermission(
        @Req() req: Request,
        @Res() res: Response,
        @HeaderParams("token") token: string,
    ) {
        const { id } = req.staff;
        const permissions = await this.staffService.getPermission(id);

        return res.sendOK(permissions);
    }

    @Post('/reload-client')
    @UseAuth(VerificationJWT)
    @Validator({

    })
    async reloadClient(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        try {
            let cmd = 'pm2 reload 248-client';
            let cmdarray = cmd.split(" ");
            let command = spawnSync(cmdarray.shift(), cmdarray);
        } catch (error) {
            console.log('reload client ERROR', error);

        }

        return res.sendOK({})
    }



} // END FILE
