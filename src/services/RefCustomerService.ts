// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { RefCustomer, RefCustomerType } from "../entity/RefCustomer";
import { Store } from "../entity/Store";
import { ProductRefPoint } from "../entity/ProductRefPoint";

interface RefCustomerQuery {
    page: number;
    limit: number
    search?: string;
    storeId: number;
    isConfirmed?: boolean;
    type?: RefCustomerType;
    productId?: number;
}

@Service()
export class RefCustomerService {

    async getManyAndCount({
        page,
        limit,
        search = '',
        storeId,
        isConfirmed,
        type,
        productId
    }: RefCustomerQuery) {
        let where = ` refCustomer.isDeleted = false AND store.id = :storeId`;

        if (typeof isConfirmed == "boolean") {
            where += ' AND refCustomer.isConfirmed = :isConfirmed'
        }

        if (type) {
            where += ' AND refCustomer.type = :type'
        }

        if (productId) {
            where += ` AND product.id = :productId`
        }

        const [refCustomers, total] = await RefCustomer.createQueryBuilder('refCustomer')
            .leftJoinAndSelect('refCustomer.customer', 'customer')
            .leftJoinAndSelect('customer.store', 'store')
            .leftJoinAndSelect('refCustomer.order', 'order')
            .leftJoinAndSelect('refCustomer.registerCustomer', 'registerCustomer')
            .leftJoinAndSelect('order.customer', 'customerOrderd')
            .leftJoinAndSelect('order.details', 'details')
            .leftJoinAndSelect('details.product', 'product')
            .leftJoinAndSelect('product.productCategory', 'productCategory')
            .leftJoinAndSelect('details.refCustomer', 'refCustomerHelp')
            .where(where, { search: `%${search}%`, storeId, isConfirmed, type, productId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('refCustomer.id', 'DESC')
            .getManyAndCount()

        if (productId) {
            for (const ref of refCustomers) {
                const productRefPoint = await ProductRefPoint.createQueryBuilder('productRefPoint')
                    .leftJoinAndSelect('productRefPoint.refCustomer', 'refCustomer')
                    .leftJoinAndSelect('productRefPoint.product', 'product')
                    .where('product.id = :productId AND refCustomer.id = refCustomerId AND productRefPoint.isDeleted = false', { productId, refCustomerId: ref.id })
                    .getOne()

                if (productRefPoint) {
                    ref.productRefPoint = productRefPoint.refPoint
                    ref.productPrice = productRefPoint.price
                } else {
                    ref.productRefPoint = ref?.order?.details[0]?.product.refPoint || ref?.order?.details[0]?.product?.productCategory.refPoint || 0
                    ref.productPrice = ref?.order?.details[0]?.product.finalPrice || 0
                }
                ref.productRefQuantity = ref?.order?.details[0]?.quantity || 0
                ref.productTotalPoint = ref.productRefQuantity * (ref.productPrice * ref.productRefPoint / 100)
            }
        }


        return { refCustomers, total }
    }

    async getOne(refCustomerId: number, storeId: number) {

        const refCustomer = await RefCustomer.createQueryBuilder('refCustomer')
            .leftJoinAndSelect('refCustomer.customer', 'customer')
            .leftJoinAndSelect('refCustomer.registerCustomer', 'registerCustomer')
            .leftJoinAndSelect('refCustomer.order', 'order')
            .leftJoinAndSelect('order.customer', 'customerOrderd')
            .leftJoinAndSelect('order.store', 'store')
            .leftJoinAndSelect('order.details', 'details')
            .leftJoinAndSelect('details.product', 'product')
            .leftJoinAndSelect('details.refCustomer', 'refCustomerHelp')
            .where('refCustomer.isDeleted  = false AND store.id = :storeId AND refCustomer.id = :refCustomerId', { storeId, refCustomerId })
            .getOne()

        return refCustomer
    }

} //END FILE
