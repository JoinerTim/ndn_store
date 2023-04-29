// IMPORT LIBRARY
import { Property, Description, ArrayOf, CollectionOf } from "@tsed/schema";

// IMPORT CUSTOM

export class Category {
    @Property()
    level1: string;
}

export class ItemsEntity {
    @Property()
    name: string;

    @Property()
    code: string;

    @Property()
    quantity: number;

    @Property()
    price: number;

    @Property()
    length: number;

    @Property()
    width: number;

    @Property()
    height: number;

    @Property()
    category: Category;


}


export class TransportOrderInsert {

    // PROPERTIES
    @Property()
    payment_type_id: number;

    @Property()
    note: string;

    @Property()
    to_ward_code: string

    @Property()
    from_name: string;

    @Property()
    from_phone: string;

    @Property()
    from_address: string;

    @Property()
    from_ward_name: string;

    @Property()
    from_district_name: string;

    @Property()
    from_province_name: string;

    @Property()
    required_note: string;

    @Property()
    return_name: string;

    @Property()
    return_phone: string;

    @Property()
    return_address: string;

    @Property()
    return_ward_name: string;

    @Property()
    return_district_name: string;

    @Property()
    return_province_name: string;

    @Property()
    client_order_code: string;

    @Property()
    order_code: string

    @Property()
    to_name: string;

    @Property()
    to_phone: string;

    @Property()
    to_address: string;

    @Property()
    to_ward_name: string;

    @Property()
    to_district_name: string;

    @Property()
    to_province_name: string;

    @Property()
    cod_amount: number;

    @Property()
    content: string;

    @Property()
    weight: number;

    @Property()
    length: number;

    @Property()
    width: number;

    @Property()
    height: number;

    @Property()
    cod_failed_amount: number;

    @Property()
    pick_station_id: number;

    @Property()
    deliver_station_id?: null;

    @Property()
    insurance_value: number;

    @Property()
    service_id: number;

    @Property()
    service_type_id: number;

    @Property()
    coupon?: null;

    @Property()
    pick_shift?: null;

    @Property()
    pickup_time: number;

    @ArrayOf(ItemsEntity)
    @Property({ type: ItemsEntity, isArray: true })
    items: ItemsEntity[];

} // END FILE


export class TransportStoreInsert {
    @Property()
    district_id: number

    @Property()
    ward_code: string

    @Property()
    name: string

    @Property()
    phone: string

    @Property()
    address: string
}

export class TransportOrderCodUpdate {
    @Property()
    order_code: string;

    @Property()
    cod_amount: number;
}


export class TransportLeadTimeParams {
    @Property()
    from_district_id: number

    @Property()
    from_ward_code: string

    @Property()
    to_district_id: number

    @Property()
    to_ward_code: string

    @Property()
    service_id: number

}


export class TransportCaculateOrderFee {
    @Property()
    from_district_id: number;

    @Property()
    service_id: number;

    @Property()
    service_type_id?: null;

    @Property()
    to_district_id: number;

    @Property()
    to_ward_code: string;

    @Property()
    height: number;

    @Property()
    length: number;

    @Property()
    weight: number;

    @Property()
    width: number;

    @Property()
    insurance_value: number;

    @Property()
    coupon?: null;

}
