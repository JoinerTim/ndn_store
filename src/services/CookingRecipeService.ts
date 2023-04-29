// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { CookingRecipe } from "../entity/CookingRecipe";

interface CookingRecipeQuery {
    page: number;
    limit: number
    search?: string
}

@Service()
export class CookingRecipeService {

    async getManyAndCount({
        page,
        limit,
        search = '',
    }: CookingRecipeQuery) {
        let where = `cookingRecipe.name LIKE :search AND cookingRecipe.isDeleted = false`;

        const [cookingRecipes, total] = await CookingRecipe.createQueryBuilder('cookingRecipe')
            .where(where, { search: `%${search}%` })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('cookingRecipe.id', 'DESC')
            .getManyAndCount()

        return { cookingRecipes, total }
    }

} //END FILE
