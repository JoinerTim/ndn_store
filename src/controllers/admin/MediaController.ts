// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, MultipartFile } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { ValidateFile, Validator } from '../../middleware/validator/Validator';
import { Media } from '../../entity/Media';
import { MediaService } from '../../services/MediaService';
import fse from "fs-extra";
import path from 'path';
import CONFIG from '../../../config';
import { ImageUtil } from '../../util/image';

@Controller("/admin/media")
@Docs("docs_admin")
export class MediaController {
    constructor(
        private mediaService: MediaService
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
        const { medias, total } = await this.mediaService.getManyAndCount({
            limit,
            search,
            page
        })

        return res.sendOK({ medias, total });
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        media: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("media") media: Media,
    ) {
        await media.save()
        return res.sendOK(media)
    }

    @Post('/upload/video')
    @UseAuth(VerificationJWT)
    uploadVideo(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @MultipartFile('file') file: Express.Multer.File,
    ) {
        file.path = file.path.replace(CONFIG.UPLOAD_DIR, '');
        return res.sendOK(file)
    }

    @Post('/upload')
    @UseAuth(VerificationJWT)
    @ValidateFile()
    async uploadFile(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @MultipartFile('file') file: Express.Multer.File,
    ) {
        const oldFilePath = file.path
        const newDir = oldFilePath.replace(oldFilePath.split('/').pop(), '')
        console.log('newDir:', newDir)

        const newPath = await ImageUtil.compress(file.path, newDir)

        file.path = newPath.replace(CONFIG.UPLOAD_DIR, '');

        fse.unlinkSync(oldFilePath);


        return res.sendOK(file)
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:mediaId')
    @UseAuth(VerificationJWT)
    @Validator({
        mediaId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("mediaId") mediaId: number,
    ) {
        const media = await Media.findOneOrThrowId(mediaId)
        media.isDeleted = true;
        await media.save()

        return res.sendOK(media)
    }

} // END FILE
