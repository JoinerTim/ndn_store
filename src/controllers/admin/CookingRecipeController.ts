// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { CookingRecipe } from '../../entity/CookingRecipe';
import { CookingRecipeService } from '../../services/CookingRecipeService';

@Controller("/admin/cookingRecipe")
@Docs("docs_admin")
export class CookingRecipeController {
    constructor(
        private cookingRecipeService: CookingRecipeService
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
        const { cookingRecipes, total } = await this.cookingRecipeService.getManyAndCount({
            limit,
            search,
            page
        })

        return res.sendOK({ cookingRecipes, total });
    }


    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        cookingRecipe: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("cookingRecipe") cookingRecipe: CookingRecipe,
    ) {
        await cookingRecipe.save()
        return res.sendOK(cookingRecipe)
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:cookingRecipeId')
    @UseAuth(VerificationJWT)
    @Validator({
        cookingRecipe: Joi.required(),
        cookingRecipeId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("cookingRecipe") cookingRecipe: CookingRecipe,
        @PathParams("cookingRecipeId") cookingRecipeId: number,
    ) {
        await CookingRecipe.findOneOrThrowId(cookingRecipeId)
        cookingRecipe.id = +cookingRecipeId
        await cookingRecipe.save()

        return res.sendOK(cookingRecipe)
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:cookingRecipeId')
    @UseAuth(VerificationJWT)
    @Validator({
        cookingRecipeId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("cookingRecipeId") cookingRecipeId: number,
    ) {
        const cookingRecipe = await CookingRecipe.findOneOrThrowId(cookingRecipeId)
        cookingRecipe.isDeleted = true;
        await cookingRecipe.save()

        return res.sendOK(cookingRecipe)
    }

} // END FILE
