// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { OneSignal } from "../entity/OneSignal";

interface OneSignalQuery {
    customerId?: number
}

@Service()
export class OneSignalService {

    async getMany({
        customerId
    }: OneSignalQuery) {
        let where = `oneSignal.customerId = :customerId`;

        const [oneSignals, total] = await OneSignal.createQueryBuilder('oneSignal')
            .where(where, { customerId })
            .orderBy('oneSignal.id', 'DESC')
            .getManyAndCount()

        return oneSignals
    }

} //END FILE
