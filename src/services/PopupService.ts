// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { Popup } from "../entity/Popup";

interface PopupQuery {
    page: number;
    limit: number;
    search?: string;
    isVisible?: boolean;
    storeId?: number
}

@Service()
export class PopupService {

    async getManyAndCount({
        page,
        limit,
        search = '',
        isVisible,
        storeId
    }: PopupQuery) {
        let where = `popup.title LIKE :search AND popup.isDeleted = false`;

        if (typeof isVisible == 'boolean') {
            where += ` AND popup.isVisible = :isVisible`;
        }

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const [popups, total] = await Popup.createQueryBuilder('popup')
            .leftJoinAndSelect('popup.product', 'product')
            .leftJoinAndSelect('popup.store', 'store')
            .where(where, { search: `%${search}%`, isVisible, storeId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('popup.id', 'DESC')
            .getManyAndCount()

        return { popups, total }
    }

    async getOne(popupId: number, storeId?: number) {

        const popup = await Popup.createQueryBuilder('popup')
            .leftJoinAndSelect('popup.store', 'store')
            .where('store.id = :storeId AND popup.id = :popupId', { storeId, popupId })
            .getOne()

        return popup;
    }

} //END FILE
