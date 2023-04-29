// IMPORT LIBRARY
import { Property } from "@tsed/schema";

// IMPORT CUSTOM
import { OrderReceipt } from '../entity/OrderReceipt';

export class OrderReceiptInsert {
    // Transform to draw entity
    async toOrderReceipt() {
        const orderReceipt = new OrderReceipt()
        orderReceipt.companyName = this.companyName
        orderReceipt.taxCode = this.taxCode
        orderReceipt.address = this.address

        await orderReceipt.assignCity(this.cityId)
        await orderReceipt.assignDistrict(this.districtId)
        await orderReceipt.assignWard(this.wardId)

        return orderReceipt
    }

    // PROPERTIES
    @Property()
    companyName: string; //tên đơn vị

    @Property()
    taxCode: string;

    @Property()
    address: string;

    @Property()
    cityId: number

    @Property()
    districtId: number

    @Property()
    wardId: number

} // END FILE
