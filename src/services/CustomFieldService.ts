// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { CustomField } from "../entity/CustomField";
import { Store } from "../entity/Store";

interface CustomFieldQuery {
    page: number;
    limit: number
    search?: string
    storeId?: number
}

const customFieldDefaults = ['Thành phần', 'Trọng lượng', 'Nguồn gốc', 'Hạn sử dụng']

@Service()
export class CustomFieldService {

    $onReady() {
        this.init()
    }

    async createOrUpdate(customField: CustomField, store: Store, customerFieldId: number = null) {
        if (customerFieldId) {
            const existCustomField = await CustomField.findOneOrThrowId(customerFieldId, {
                where: {
                    store,
                    isDeleted: false
                }
            }, 'Trường mở rộng');
        }

        customField.store = store;
        customField.id = customerFieldId;
        await customField.save()

        return customField
    }

    async init() {
        for (const item of customFieldDefaults) {
            let customField = await CustomField.findOne({
                where: {
                    name: item
                }
            })

            if (!customField) {
                customField = new CustomField()
                customField.name = item
                await customField.save()
            }
        }
    }

    async initForStore(store: Store) {
        for (const item of customFieldDefaults) {
            let customField = await CustomField.findOne({
                where: {
                    name: item,
                    store
                }
            })

            if (!customField) {
                customField = new CustomField()
                customField.name = item
                customField.store = store;
                await customField.save()
            }
        }
    }

    async getManyAndCount({
        page,
        limit,
        search = '',
        storeId
    }: CustomFieldQuery) {
        let where = `customField.name LIKE :search AND customField.isDeleted = false`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const [customFields, total] = await CustomField.createQueryBuilder('customField')
            .leftJoinAndSelect('customField.store', 'store')
            .where(where, { search: `%${search}%`, storeId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('customField.id', 'DESC')
            .getManyAndCount()

        return { customFields, total }
    }

} //END FILE
