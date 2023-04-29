// IMPORT LIBRARY
import { Controller, Req, Get, Res, Response, HeaderParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { CookingRecipeService } from '../../services/CookingRecipeService';
import { UseAuthHash } from '../../middleware/auth/UseAuthHash';

@Controller("/customer/cookingRecipe")
@Docs("docs_customer")
export class CookingRecipeController {
    constructor(
        private cookingRecipeService: CookingRecipeService
    ) { }


    // =====================GET LIST=====================
    @Get('')
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
        const { cookingRecipes, total } = await this.cookingRecipeService.getManyAndCount({
            limit,
            search,
            page
        })

        return res.sendOK({ cookingRecipes, total });
    }

} // END FILE
