// IMPORT LIBRARY
import { Controller, Req, Res, Response, MultipartFile, Post } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { ValidateFile } from '../../middleware/validator/Validator';
import CONFIG from '../../../config';
import { ImageUtil } from '../../util/image';
import { v4 } from 'uuid';
import path from 'path';
import fse from "fs-extra";
import { BadRequest } from '@tsed/exceptions';

@Controller("/customer/image")
@Docs("docs_customer")
export class ImageController {
    constructor(
    ) { }


    // =====================GET LIST=====================
    @Post('/upload')
    @ValidateFile()
    async uploadFile(
        @Req() req: Request,
        @Res() res: Response,
        @MultipartFile('file') file: Express.Multer.File,
    ) {
        if (!file.mimetype.includes('image')) {
            fse.unlinkSync(file.path)
            throw new BadRequest("Only accept image format!");
        }

        const oldFilePath = file.path
        fse.unlinkSync(oldFilePath);

        return res.sendOK(file)
    }

} // END FILE
