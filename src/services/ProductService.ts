// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";
import { escape } from "mysql2";
import { ProductCustomFieldInsert } from "../entity-request/ProductCustomFieldInsert";
import { FlashSaleCampaign } from "../entity/FlashSaleCampaign";


// IMPORT CUSTOM
import { DeliveryType, Product } from "../entity/Product";
import { ProductCustomField } from "../entity/ProductCustomField";
import { ProductTag } from "../entity/ProductTag";
import { ProductVariation } from "../entity/ProductVariation";
import { PromotionCampaign, PromotionConditionType, PromotionDiscountType } from "../entity/PromotionCampaign";
import { Store } from "../entity/Store";
import { LangCode } from "../types/language";
import { QueryObject } from "../types/query";
import { getCurrentTimeInt } from "../util/helper";
import { Warehouse } from "../entity/Warehouse";
import { Depot } from "../entity/Depot"
import { Inventory } from "../entity/Inventory";
import { InventoryStatus } from "../entity/Inventory";
import { InventoryType } from "../entity/Inventory";
import { Employee } from "../entity/Employee";
import { InventoryDetail } from "../entity/InventoryDetail";
import moment from "moment";

interface ProductCreateParam {
    product: Product,
    images?: string[],
    productCategoryId?: number
    productId?: number
    productVariations?: ProductVariation[]
    productTagIds?: number[]
    productCustomFields?: ProductCustomFieldInsert[],
    productTaxId?: number
    storeId: number
    inventoryNote?: string
    depotId?: number
    employee: Employee
    transportIds?: number[]
}

interface ProductQuery {
    page: number;
    limit: number
    search?: string,
    productCategoryId?: number,
    productCategoryIds?: number[]
    isActive?: boolean
    queryObject?: string
    customerId?: number
    onlyLiked?: boolean
    onlyViewed?: boolean
    star?: number
    storeId?: number
    isAdmin?: boolean;
    productIds?: number[]
    deliveryType?: DeliveryType
    lang?: LangCode
    ignoreIds?: number[]
    depotId?: number
    isOutOfStock?: boolean
}

@Service()
export class ProductService {

    async getManyAndCount({
        page,
        limit,
        search = '',
        productCategoryId,
        productCategoryIds,
        isActive,
        queryObject,
        customerId,
        onlyLiked,
        onlyViewed,
        star,
        storeId,
        productIds,
        deliveryType,
        lang,
        ignoreIds,
        depotId,
    }: ProductQuery) {
        let where = `product.isDeleted = false`;

        if (productCategoryId) {
            where += ` AND productCategory.id = :productCategoryId`;
        }

        if (isActive) {
            where += ' AND product.isActive = :isActive'
        }

        if (typeof isActive == 'boolean') {
            where += ' AND product.isActive = :isActive'
        }

        if (storeId) {
            where += ` AND (store.id = :storeId OR product.deliveryType = ${escape(DeliveryType.FromFactory)})`
        }

        if (productIds?.length) {
            where += ' AND product.id IN (:...productIds)'
        }

        if (deliveryType) {
            where += ' AND product.deliveryType = :deliveryType'
        }

        if (ignoreIds) {
            where += ' AND product.id NOT IN (:...ignoreIds)'
        }

        if (depotId) {
            where += ` AND depot.id = :depotId`
        }

        const current = getCurrentTimeInt();


        const subFlashSaleQuery = FlashSaleCampaign.createQueryBuilder('flashSaleCampaign')
            .select('flashSaleCampaign.id', 'id')
            .where(`${current} BETWEEN flashSaleCampaign.startAt AND flashSaleCampaign.endAt AND flashSaleCampaign.isDeleted = 0`)
            .andWhere(storeId ? `flashSaleCampaign.storeId = ${storeId}` : 'flashSaleCampaign.storeId is null');

        const subPromotionQuery = PromotionCampaign.createQueryBuilder('promotionCampaign')
            .select('promotionCampaign.id', 'id')
            .where(`${current} BETWEEN promotionCampaign.startAt AND promotionCampaign.endAt AND promotionCampaign.isDeleted = 0`)
            .andWhere(storeId ? `promotionCampaign.storeId = ${storeId}` : 'promotionCampaign.storeId is null');

        const subDiscountPromotionQuery = subPromotionQuery.clone()
            .andWhere(`promotionCampaign.discountType = ${escape(PromotionDiscountType.Percent)}`)

        const selectPrice = 'IF(promotionCampaignDetails2.id is not null, promotionCampaignDetails2.finalPrice, IF( flashSaleCampaignDetail.id is not null, flashSaleCampaignDetail.finalPrice, product.finalPrice))'



        const query = Product.createQueryBuilder('product')
            .addSelect(selectPrice, 'finalPrice2')
            .leftJoinAndSelect('product.store', 'store', 'store.isDeleted = 0')
            .leftJoinAndSelect('product.productCategory', 'productCategory')
            .leftJoinAndSelect('product.images', 'media')
            .leftJoinAndSelect('product.warehouses', 'warehouses')
            .leftJoinAndSelect('warehouses.depot', 'depot')
            .leftJoinAndSelect('product.productTax', 'productTax')
            .leftJoinAndSelect('product.promotionCampaignDetails', 'promotionCampaignDetail', `promotionCampaignDetail.promotionCampaignId IN (${subPromotionQuery.getQuery()})`)
            .leftJoinAndSelect('promotionCampaignDetail.promotionCampaign', 'promotionCampaign')
            .leftJoinAndSelect('product.productTags', 'productTags')
            .leftJoinAndSelect('product.productVariations', 'productVariation', 'productVariation.isDeleted = 0')
            .leftJoinAndSelect('product.productCustomFields', 'productCustomField')
            .leftJoinAndSelect('productCustomField.customField', 'customField')
            .leftJoin('product.productTags', 'productTag')
            .leftJoinAndSelect('product.flashSaleCampaignDetails', 'flashSaleCampaignDetail', `flashSaleCampaignDetail.isDeleted = 0 AND flashSaleCampaignDetail.flashSaleCampaignId IN (${subFlashSaleQuery.getQuery()})`)
            .leftJoinAndSelect('flashSaleCampaignDetail.flashSaleCampaign', 'flashSaleCampaign')
            .leftJoinAndSelect('store.ward', 'ward')
            .leftJoinAndSelect('store.district', 'district')
            .leftJoinAndSelect('store.city', 'city')


            //discount promotion query
            .leftJoin('product.promotionCampaignDetails', 'promotionCampaignDetails2', `promotionCampaignDetails2.isGift = 0 AND promotionCampaignDetails2.promotionCampaignId IN (${subDiscountPromotionQuery.getQuery()})`)
        //

        const searchEscape = escape(search)
        if (search.length >= 3) {
            let tmpSearch = `%${search}%`
            const subQueryTag = ProductTag.createQueryBuilder('productTag')
                .select('productTag.id', 'id')
                .where(`productTag.name LIKE ${escape(tmpSearch)}`)

            let whereSearch = `(MATCH(product.name) AGAINST (${searchEscape} IN NATURAL LANGUAGE MODE) OR MATCH(product.nameEn) AGAINST (${searchEscape} IN NATURAL LANGUAGE MODE) LIKE :search OR product.code LIKE :search OR productTag.id IN (${subQueryTag.getQuery()}) OR productCategory.name LIKE :search)`
            query.addSelect(`MATCH(product.name) AGAINST (${searchEscape} IN NATURAL LANGUAGE MODE)`, 'fullNameMatch')
                .andWhere(whereSearch)
            query.orderBy('fullNameMatch', 'DESC')


        } else {
            query.andWhere(`CONCAT( product.name, ' ', product.brandName, ' ', product.code, ' ', IFNULL(productCategory.name,'') ) LIKE :search`)
        }

        if (star) {
            const selectStar = '(product.totalStar / product.totalRate)';
            query.addSelect(selectStar, 'productStar')
            if (star == 5) {
                where += ` AND ${selectStar} = 5`
            } else {
                const toStar = star + 0.99;
                where += ` AND ${selectStar} BETWEEN :star AND ${toStar}`
            }
        }

        if (customerId) {
            let whereLike = 'likedProduct.customerId = :customerId'
            let whereView = 'viewedProduct.customerId = :customerId'


            if (onlyLiked) {
                query.innerJoinAndSelect('product.likedProducts', 'likedProduct', whereLike, { customerId, storeId })
                query.leftJoinAndSelect('product.viewedProducts', 'viewedProduct', whereView, { customerId })
            } else if (onlyViewed) {
                query.innerJoinAndSelect('product.viewedProducts', 'viewedProduct', whereView, { customerId, storeId })
                query.leftJoinAndSelect('product.likedProducts', 'likedProduct', whereLike, { customerId, storeId })
            } else {
                query.leftJoinAndSelect('product.likedProducts', 'likedProduct', whereLike, { customerId, storeId })
                query.leftJoinAndSelect('product.viewedProducts', 'viewedProduct', whereView, { customerId, storeId })
            }
        }

        if (queryObject) {
            const object = JSON.parse(queryObject) as QueryObject[];
            if (!Array.isArray(object)) {
                throw new BadRequest("Query object is not valid");
            }

            for (const item of object) {
                if (item.type == 'sort') {
                    query.addOrderBy(`${item.field}`, item.value)
                }

                else if (item.type == 'single-filter') {
                    // const value = escape(item.value)
                    query.andWhere(`${item.field} LIKE '%${item.value}%'`)
                }

                else if (item.type == 'multi-filter') {
                    const value = item.value.map(e => `${escape(e)}`).join(', ');
                    query.andWhere(`${item.field} IN (${value})`)
                }

                else if (item.type == 'range') {
                    if (item.field == 'product.finalPrice') {
                        query.andWhere(`${selectPrice} BETWEEN ${escape(item.value1)} AND ${escape(item.value2)}`)
                    } else {
                        query.andWhere(`${item.field} BETWEEN ${escape(item.value1)} AND ${escape(item.value2)}`)
                    }
                }
            }
        }

        //order by
        if (onlyViewed) {
            query.addOrderBy('viewedProduct.updatedAt', 'DESC')
        } else if (onlyLiked) {
            query.addOrderBy('likedProduct.updatedAt', 'DESC')
        } else {
            query.addOrderBy('product.id', 'DESC')
        }
        //

        // console.log('query product', query.getQuery());

        const [products, total] = await query
            .andWhere(where, {
                search: `%${search}%`,
                productCategoryId,
                productCategoryIds,
                isActive,
                storeId, productIds,
                deliveryType,
                ignoreIds,
                depotId
            })
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        if (customerId) {
            for (const product of products) {
                product.isLiked = !!product.likedProducts?.length
                product.isViewed = !!product.viewedProducts?.length
            }
        }


        for (const product of products) {
            product.isPromotion = false;
            product.isFlashSale = false;
            if (product.productCategory) {
                switch (lang) {
                    case LangCode.Eng:
                        product.productCategory.name = product.productCategory.nameEn || product.productCategory.name;
                        break;

                    default:
                        break;
                }
            }

            if (product.productCustomFields) {
                for (const productCustomField of product.productCustomFields) {
                    switch (lang) {
                        case LangCode.Eng:
                            productCustomField.customField.name = productCustomField.customField.nameEn;
                            break;

                        default:
                            break;
                    }
                }
            }

        }

        return { products, total }
    }

    async getRawMany({ page,
        limit,
        search = '',
        productCategoryId,
        queryObject,
        isOutOfStock,
        depotId,
        storeId
    }: ProductQuery) {

        let where = 'product.isDeleted = false'

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        if (typeof isOutOfStock == 'boolean') {
            where += ` AND product.isOutStock = :isOutStock`
        }

        if (productCategoryId) {
            where += ` AND productCategory.id = :productCategoryId`
        }

        if (depotId) {
            where += ` AND depot.id = :depotId`
        }

        const query = Product.createQueryBuilder('product')
            .select(['product.nameEn AS name', 'product.id AS productId', 'product.code AS code', 'product.importPrice as importPrice',
                'warehouses.minimumStock as minimumStock', 'COALESCE(productCategory.nameEn, "") as productCategoryName',
                'warehouses.isOutOfStock as isOutOfStock', 'depot.id as depotId', 'depot.name as depotName',
                'COALESCE(SUM(warehouses.quantity), 0) as quantity',
                'COALESCE(SUM(warehouses.pending), 0) as pending',
                'COALESCE(quantity * importPrice, 0) as totalMoneyImport',
                'COALESCE(quantity * product.finalPrice, 0) as totalMoneySell',
            ])
            .leftJoin('product.productCategory', 'productCategory')
            .leftJoin('product.warehouses', 'warehouses')
            .leftJoin('warehouses.depot', 'depot')
            .leftJoin('depot.store', 'store')
            .leftJoin('product.productTags', 'productTag')
            .groupBy('product.id')

        const searchEscape = escape(search)
        if (search.length >= 3) {
            let tmpSearch = `%${search}%`
            const subQueryTag = ProductTag.createQueryBuilder('productTag')
                .select('productTag.id', 'id')
                .where(`productTag.name LIKE ${escape(tmpSearch)}`)

            let whereSearch = `(MATCH(product.name) AGAINST (${searchEscape} IN NATURAL LANGUAGE MODE) OR MATCH(product.nameEn) AGAINST (${searchEscape} IN NATURAL LANGUAGE MODE) LIKE :search OR product.code LIKE :search OR productTag.id IN (${subQueryTag.getQuery()}) OR productCategory.name LIKE :search)`

            query.andWhere(whereSearch)
        } else {
            query.andWhere(`CONCAT( product.name, ' ', product.brandName, ' ', product.code, ' ', IFNULL(productCategory.name,'') ) LIKE :search`)
        }

        if (queryObject) {
            const object = JSON.parse(queryObject) as QueryObject[];
            if (!Array.isArray(object)) {
                throw new BadRequest("Query object is not valid");
            }

            for (const item of object) {
                if (item.type == 'sort') {
                    query.addOrderBy(`${item.field}`, item.value)
                }

                else if (item.type == 'single-filter') {
                    // const value = escape(item.value)
                    query.andWhere(`${item.field} LIKE '%${item.value}%'`)
                }

                else if (item.type == 'multi-filter') {
                    const value = item.value.map(e => `${escape(e)}`).join(', ');
                    query.andWhere(`${item.field} IN (${value})`)
                }

                else if (item.type == 'range') {
                    query.andWhere(`${item.field} BETWEEN ${escape(item.value1)} AND ${escape(item.value2)}`)
                }
            }
        }

        const products = await query
            .andWhere(where, {
                search: `%${search}%`,
                productCategoryId,
                storeId,
                depotId,
                isOutOfStock
            })
            .skip((page - 1) * limit)
            .take(limit)
            .getRawMany()

        return { products, total: products.length }
    }

    /**
     * map giá khuyến mãi vào sp
     */
    async mapPromotion(products: Product[], storeId: number) {
        if (!products.length) {
            return;
        }

        const currentAt = getCurrentTimeInt()

        let where = 'promotionCampaign.isDeleted = 0 AND promotionCampaign.startAt <= :currentAt AND promotionCampaign.endAt >= :currentAt AND promotionCampaign.discountType IN (:...discountTypes) AND product.id IN (:...productIds) AND promotionCampaign.conditionValue = 0';

        if (storeId) {
            where += ' AND store.id = :storeId'
        } else {
            where += ' AND store.id is null'
        }

        const promotionCampaigns = await PromotionCampaign.createQueryBuilder('promotionCampaign')
            .leftJoin('promotionCampaign.store', 'store')
            .leftJoinAndSelect('promotionCampaign.promotionCampaignDetails', 'promotionCampaignDetail', 'promotionCampaignDetail.isGift = 0')
            .innerJoinAndSelect('promotionCampaignDetail.product', 'product')
            .where(where, {
                currentAt,
                productIds: products.map(e => e.id),
                discountTypes: [PromotionDiscountType.Percent],
                conditionType: PromotionConditionType.SomeProduct,
                storeId
            })
            .getMany();

        console.log('productService.mapPromotion: ', promotionCampaigns);


        for (const product of products) {
            for (const promotionCampaign of promotionCampaigns) {
                const findPromotion = promotionCampaign.promotionCampaignDetails.find(e => e.product.id == product.id)
                if (findPromotion) {
                    product.finalPrice = findPromotion.finalPrice;
                    product.isPromotion = true;
                }
            }
        }
    }

    /**
     * map giá flash sale vào sp
     */
    async mapFlashSale(products: Product[]) {
        for (const product of products) {
            if (product.flashSaleCampaignDetails?.length) {
                product.finalPrice = product.flashSaleCampaignDetails[0].finalPrice
                product.isFlashSale = true;
            }
        }
    }



    async getOne(productId: number, customerId: number = null, storeId: number = null, lang: LangCode = LangCode.Vi) {
        let where = `product.id = :productId AND product.isDeleted = false`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const current = getCurrentTimeInt();

        const subFlashSaleQuery = FlashSaleCampaign.createQueryBuilder('flashSaleCampaign')
            .select('flashSaleCampaign.id', 'id')
            .where(`${current} BETWEEN flashSaleCampaign.startAt AND flashSaleCampaign.endAt AND flashSaleCampaign.isDeleted = 0`)

        const subPromotionQuery = PromotionCampaign.createQueryBuilder('promotionCampaign')
            .select('promotionCampaign.id', 'id')
            .where(`${current} BETWEEN promotionCampaign.startAt AND promotionCampaign.endAt AND promotionCampaign.isDeleted = 0`)

        const query = Product.createQueryBuilder('product')
            .leftJoinAndSelect('product.productCategory', 'productCategory')
            .leftJoinAndSelect('product.images', 'media')
            .leftJoinAndSelect('product.warehouses', 'warehouses')
            .leftJoinAndSelect('warehouses.depot', 'depot')
            .leftJoinAndSelect('product.store', 'store', 'store.isDeleted = 0')
            .leftJoinAndSelect('product.productTags', 'productTags')
            .leftJoinAndSelect('product.productTax', 'productTax')
            .leftJoinAndSelect('product.promotionCampaignDetails', 'promotionCampaignDetail', `promotionCampaignDetail.promotionCampaignId IN (${subPromotionQuery.getQuery()})`)
            .leftJoinAndSelect('promotionCampaignDetail.promotionCampaign', 'promotionCampaign')
            .leftJoinAndSelect('product.productVariations', 'productVariation', 'productVariation.isDeleted = 0')
            .leftJoinAndSelect('product.productCustomFields', 'productCustomField')
            .leftJoinAndSelect('productCustomField.customField', 'customField')
            .leftJoinAndSelect('product.flashSaleCampaignDetails', 'flashSaleCampaignDetail', `flashSaleCampaignDetail.isDeleted = 0 AND flashSaleCampaignDetail.flashSaleCampaignId IN (${subFlashSaleQuery.getQuery()})`)
            .leftJoinAndSelect('flashSaleCampaignDetail.flashSaleCampaign', 'flashSaleCampaign')
            .leftJoinAndSelect('store.ward', 'ward')
            .leftJoinAndSelect('store.district', 'district')
            .leftJoinAndSelect('store.city', 'city')
            .where(where, { productId, storeId });

        if (customerId) {
            query.leftJoinAndSelect('product.likedProducts', 'likedProduct', 'likedProduct.customerId = :customerId', { customerId })
            query.leftJoinAndSelect('product.viewedProducts', 'viewedProduct', 'viewedProduct.customerId = :customerId', { customerId })
        }

        const product = await query.getOne()

        if (!product) {
            throw new BadRequest("Sản phẩm không tồn tại");

        }

        if (customerId && product) {
            product.isLiked = !!product.likedProducts?.length
            product.isViewed = !!product.viewedProducts?.length
        }


        if (product) {
            product.isPromotion = false;
            product.isFlashSale = false;
        }

        if (product.productCategory) {
            switch (lang) {
                case LangCode.Eng:
                    product.productCategory.name = product.productCategory.nameEn || product.productCategory.name
                    break;

                default:
                    break;
            }
        }


        if (product.productCustomFields) {
            for (const productCustomField of product.productCustomFields) {
                switch (lang) {
                    case LangCode.Eng:
                        productCustomField.customField.name = productCustomField.customField.nameEn;
                        break;

                    default:
                        break;
                }
            }
        }


        return product;
    }

    public async createOrUpdate({
        product,
        images,
        productCategoryId,
        productId,
        productVariations,
        productTagIds,
        productCustomFields = [],
        productTaxId,
        storeId,
        depotId,
        inventoryNote,
        employee,
        transportIds
    }: ProductCreateParam) {
        if (images?.length) {
            await product.assignImages(images)
        }

        if (productCategoryId) {
            await product.assignProductCategory(productCategoryId);
        }

        if (productTaxId) {
            await product.assignProductTax(productTaxId)
        }

        if (typeof images == 'object' && images.length == 0) {
            product.images = [];
        }

        if (productTagIds?.length) {
            await product.assignProductTags(productTagIds)
        } else if (productTagIds?.length == 0) {
            product.productTags = null;
        }

        if (transportIds?.length) {
            await product.assignTransports(transportIds)
        } else if (transportIds?.length == 0) {
            product.transports = null;
        }

        if (productVariations?.length) {
            await ProductVariation.save(productVariations)
            product.productVariations = productVariations;
        } else {
            product.productVariations = []
        }

        //custom field
        const customFields = await Promise.all(productCustomFields.map(e => e.toProductCustomField()))
        await ProductCustomField.save(customFields);
        product.productCustomFields = customFields

        await this.validate(product, productId, storeId)


        if (storeId) await product.assignStore(storeId)

        product.finalPrice = product.unitPrice;
        await product.save();

        if (depotId) {
            const depot = await Depot.findOneOrThrowId(depotId)

            const warehouse = new Warehouse()
            warehouse.minimumStock = product.minimumStock
            warehouse.isOutOfStock = product.isOutStock
            warehouse.depot = depot
            warehouse.pending = product.pending
            warehouse.quantity = product.stock
            warehouse.product = product
            await warehouse.save()

            const inventory = new Inventory()
            inventory.type = InventoryType.Import
            await inventory.generateCode()
            inventory.note = "Auto generated when create product"
            inventory.status = InventoryStatus.Complete
            inventory.employee = employee
            inventory.depot = depot
            inventory.completedAt = moment().unix()
            inventory.completedEmployee = employee


            const inventoryDetail = new InventoryDetail()
            inventoryDetail.note = inventoryNote
            inventoryDetail.price = product.importPrice
            inventoryDetail.product = product
            inventoryDetail.quantity = product.stock
            inventoryDetail.stock = 0
            await inventoryDetail.save()

            inventory.inventoryDetails = [inventoryDetail]
            await inventory.assignStore(storeId)
            await inventory.save()
        }

        return product;
    }


    async validate(product: Product, productId: number, storeId: number) {
        const {
            code
        } = product;

        let where = 'product.isDeleted = 0'

        if (productId) {
            where += ` AND product.id != :productId`
        }

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        if (code) {
            where += ` AND product.code = :code`
        }

        const existProduct = await Product.createQueryBuilder('product')
            .leftJoinAndSelect('product.store', 'store')
            .where(where, { productId, storeId, code })
            .getOne();

        if (existProduct && existProduct.id != productId) {
            let msg = '';

            if (existProduct.code == code) {
                msg = 'Mã sản phẩm'
            }

            if (msg) {
                throw new BadRequest(`${msg} đã tồn tại`);
            }
        }
    }

} //END FILE
