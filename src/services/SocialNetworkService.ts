// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { SocialNetwork } from "../entity/SocialNetwork";

interface SocialNetworkQuery {
    page: number;
    limit: number
    search?: string
    isVisible?: boolean
}

@Service()
export class SocialNetworkService {

    async getManyAndCount({
        page,
        limit,
        search = '',
        isVisible
    }: SocialNetworkQuery) {
        let where = `socialNetwork.name LIKE :search AND socialNetwork.isDeleted = false`;

        if (isVisible) {
            where += ' AND socialNetwork.isVisible = :isVisible'
        }

        const [socialNetworks, total] = await SocialNetwork.createQueryBuilder('socialNetwork')
            .where(where, { search: `%${search}%`, isVisible })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('socialNetwork.id', 'DESC')
            .getManyAndCount()

        return { socialNetworks, total }
    }


} //END FILE
