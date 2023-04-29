// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams, MultipartFile, Post } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import CONFIG from '../../../config';
import { ImageUtil } from '../../util/image';
import { v4 } from 'uuid';
import path from 'path';
import fse from "fs-extra";
import { BadRequest } from '@tsed/exceptions';

@Controller("/store/image")
@Docs("docs_store")
export class ImageController {
    constructor(
    ) { }


    // =====================GET LIST=====================
    @Post('/upload')
    @UseAuth(VerificationJWT)
    async uploadFile(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @MultipartFile('file') file: Express.Multer.File,
    ) {
        if (!file.mimetype.includes('image')) {
            fse.unlinkSync(file.path)
            throw new BadRequest("Only accept image format!");
        }

        const oldFilePath = file.path
        const newDir = path.join(CONFIG.UPLOAD_DIR, 'image');
        const newPath = await ImageUtil.compress(file.path, newDir)

        file.path = newPath.replace(CONFIG.UPLOAD_DIR, '');

        fse.unlinkSync(oldFilePath);

        return res.sendOK(file)
    }

} // END FILE
