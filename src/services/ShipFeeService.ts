// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { City } from "../entity/City";


// IMPORT CUSTOM
import { ShipFee } from "../entity/ShipFee";
import { Store } from "../entity/Store";

interface ShipFeeQuery {
    page: number;
    limit: number
    search?: string
}

@Service()
export class ShipFeeService {

    async createOrUpdate({
        price,
        city,
        district,
        store
    }: Partial<ShipFee>) {
        let where = 'shipFee.isDeleted = 0 AND city.id = :cityId AND store.id = :storeId';

        if (district) {
            where += ` AND district.id = :districtId`
        }

        let shipFee = await ShipFee.createQueryBuilder('shipFee')
            .leftJoin('shipFee.city', 'city')
            .leftJoin('shipFee.district', 'district')
            .leftJoin('shipFee.store', 'store')
            .where(where, {
                cityId: city.id,
                districtId: district?.id,
                storeId: store.id
            })
            .getOne()

        if (!shipFee) {
            shipFee = new ShipFee()
            shipFee.city = city
            shipFee.district = district
            shipFee.store = store
        }

        shipFee.price = price;
        await shipFee.save()

        return shipFee
    }


    async init(store: Store) {
        const cities = await City.find()
        for (const city of cities) {
            await this.createOrUpdate({
                price: 30000,
                city,
                store
            })
        }
    }


    async getManyAndCount({
        page,
        limit,
        search = '',
    }: ShipFeeQuery) {
        let where = `shipFee.isDeleted = false`;

        const [shipFees, total] = await ShipFee.createQueryBuilder('shipFee')
            .where(where, { search: `%${search}%` })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('shipFee.id', 'DESC')
            .getManyAndCount()

        return { shipFees, total }
    }

} //END FILE
