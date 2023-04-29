// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { DeliveryAddress } from "../entity/DeliveryAddress";
import { Customer } from "../entity/Customer";

interface DeliveryAddressQuery {
    page: number;
    limit: number
    search?: string
    customerId: number
    storeId?: number
}

@Service()
export class DeliveryAddressService {

    async create({
        name,
        phone,
        address,
        city,
        district,
        ward,
        type,
        isDefault,
        customer
    }: Partial<DeliveryAddress>) {
        const deliveryAddress = new DeliveryAddress()

        deliveryAddress.name = name;
        deliveryAddress.phone = phone;
        deliveryAddress.address = address;
        deliveryAddress.city = city;
        deliveryAddress.district = district;
        deliveryAddress.ward = ward;

        deliveryAddress.type = type;
        deliveryAddress.isDefault = isDefault;
        deliveryAddress.customer = customer;

        if (deliveryAddress.isDefault) {
            await DeliveryAddress.createQueryBuilder()
                .update()
                .set({
                    isDefault: false
                })
                .where('customerId = :customerId', { customerId: customer.id })
                .execute()
        }
        await deliveryAddress.save()
        return deliveryAddress;

    }

    async getManyAndCount({
        page,
        limit,
        search = '',
        customerId,
        storeId
    }: DeliveryAddressQuery) {
        let where = `deliveryAddress.name LIKE :search AND deliveryAddress.isDeleted = false`;

        if (customerId) {
            where += ` AND customer.id = :customerId`
        }

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const [deliveryAddresses, total] = await DeliveryAddress.createQueryBuilder('deliveryAddress')
            .leftJoin('deliveryAddress.customer', 'customer')
            .leftJoin('customer.store', 'store')
            .leftJoinAndSelect('deliveryAddress.city', 'city')
            .leftJoinAndSelect('deliveryAddress.district', 'district')
            .leftJoinAndSelect('deliveryAddress.ward', 'ward')
            .where(where, { search: `%${search}%`, customerId, storeId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('deliveryAddress.id', 'DESC')
            .getManyAndCount()

        return { deliveryAddresses, total }
    }


    async getOne(customerId: number, storeId: number) {

        const deliveryAddress = await DeliveryAddress.createQueryBuilder('deliveryAddress')
            .leftJoin('deliveryAddress.customer', 'customer')
            .leftJoin('customer.store', 'store')
            .leftJoinAndSelect('deliveryAddress.city', 'city')
            .leftJoinAndSelect('deliveryAddress.district', 'district')
            .leftJoinAndSelect('deliveryAddress.ward', 'ward')
            .where('deliveryAddress.isDefault = true AND deliveryAddress.isDeleted = false AND customer.id = :customerId AND store.id = :storeId ', { customerId, storeId })
            .getOne()

        return deliveryAddress
    }

} //END FILE
