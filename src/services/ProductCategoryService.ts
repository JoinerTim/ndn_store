// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";


// IMPORT CUSTOM
import { ProductCategory, ProductCategoryType } from "../entity/ProductCategory";
import { Store } from "../entity/Store";
import { LangCode } from "../types/language";

interface ProductCategoryQuery {
    page: number;
    limit: number;
    search?: string;
    level?: number;
    parentId?: number;
    type?: ProductCategoryType;
    types?: ProductCategoryType[]
    isVisible?: boolean
    lang?: LangCode
    storeId: number
}

@Service()
export class ProductCategoryService {

    async createOrUpdate(productCategory: ProductCategory, store: Store, productCategoryId: number = null) {
        if (productCategoryId) {
            const existCustomField = await ProductCategory.findOneOrThrowId(productCategoryId, {
                where: {
                    store,
                    isDeleted: false
                }
            }, 'Trường mở rộng');
        }


        productCategory.store = store;
        productCategory.id = productCategoryId;
        await productCategory.save()

        return productCategory
    }

    async getManyAndCount({
        page,
        limit,
        search = '',
        level,
        parentId,
        type,
        types,
        isVisible,
        lang = LangCode.Vi,
        storeId
    }: ProductCategoryQuery) {
        let where = `productCategory.name LIKE :search AND productCategory.isDeleted = false`;

        if (level) {
            where += ' AND productCategory.level = :level'
        }

        if (parentId) {
            where += ` AND parent.id = :parentId`
        }

        if (type) {
            where += ' AND productCategory.type = :type'
        }

        if (types?.length) {
            where += ' AND productCategory.type IN (:...types)'
        }

        if (typeof isVisible == 'boolean') {
            where += ' AND productCategory.isVisible = :isVisible'
        }

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const query = ProductCategory.createQueryBuilder('productCategory')
            .leftJoinAndSelect('productCategory.store', 'store')
            .leftJoinAndSelect('productCategory.parent', 'parent')
            .leftJoinAndSelect('productCategory.children', 'children', 'children.isDeleted = 0')
            .where(where, { search: `%${search}%`, level, parentId, type, types, isVisible, storeId })



        const [productCategories, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('productCategory.position', 'ASC')
            .getManyAndCount()

        for (const productCategory of productCategories) {
            switch (lang) {
                case LangCode.Eng:
                    productCategory.name = productCategory.nameEn || productCategory.name;
                    break;

                default:
                    break;
            }
        }

        return { productCategories, total }
    }


    async checkDuplicate(productCategory: ProductCategory, productCategoryId: number = null) {
        const { slug } = productCategory

        const otherProductCategory = await ProductCategory.findOne({ where: [{ slug, isDeleted: false }] })

        if (otherProductCategory && otherProductCategory.id != productCategoryId) {
            let message = ""

            if (otherProductCategory.slug == slug && slug) {
                message = `Slug: ${slug}`
            }

            if (message) {
                throw new BadRequest(`${message} đã tồn tại!`)
            }

        }
    }
} //END FILE
