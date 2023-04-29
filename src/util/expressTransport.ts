import axios from "axios";
import { Order } from "../entity/Order";

export interface StoreInfo {
    district_id: number,
    ward_code: string,
    name: string,
    phone: string,
    address: string
}

export interface QueryStore {
    offset?: number,
    limit?: number,
    client_phone?: string,
}

export interface QueryOffset {
    district_id: string;
    ward_code: string;
    offset: number;
    limit: number;
}


export interface OrderCreateParam {
    payment_type_id: number;
    note: string;
    from_name: string;
    from_phone: string;
    from_address: string;
    from_ward_name: string;
    from_district_name: string;
    from_province_name: string;
    required_note: string;
    return_name: string;
    return_phone: string;
    return_address: string;
    return_ward_name: string;
    return_district_name: string;
    return_province_name: string;
    client_order_code: string;
    to_name: string;
    to_phone: string;
    to_address: string;
    to_ward_name: string;
    to_district_name: string;
    to_province_name: string;
    cod_amount: number;
    content: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    cod_failed_amount: number;
    pick_station_id: number;
    deliver_station_id?: null;
    insurance_value: number;
    service_id: number;
    service_type_id: number;
    coupon?: null;
    pick_shift?: null;
    pickup_time: number;
    order_code?: string;
    items?: (ItemsEntity)[] | null;
    to_ward_code?: string
}
export interface ItemsEntity {
    name: string;
    code: string;
    quantity: number;
    price: number;
    length: number;
    width: number;
    height: number;
    category: Category;
}
export interface Category {
    level1: string;
}

export interface OrderCodes {
    order_codes?: (string)[] | null;
}

export interface OrderCodUpdate {
    order_code: string;
    cod_amount: number;
}

export interface LeadTimeParams {
    from_district_id: number;
    from_ward_code: string;
    to_district_id: number;
    to_ward_code: string;
    service_id: number;
}

export interface CaculateOrderFee {
    from_district_id: number;
    service_id: number;
    service_type_id?: null;
    to_district_id: number;
    to_ward_code: string;
    height: number;
    length: number;
    weight: number;
    width: number;
    insurance_value: number;
    coupon?: null;
}


export interface AvailableServicePrams {
    shop_id: number;
    from_district: number;
    to_district: number;
}


const apiKey = '28dc37d8-e30d-11ed-943b-f6b926345ef9';
const baseURL = 'https://dev-online-gateway.ghn.vn/shiip/public-api/v2'

const ghnApi = axios.create({
    baseURL,
    headers: {
        'token': apiKey,
        'Content-Type': 'application/json',
    },
});


export class ExpressTransport {

    static async createStore(storeInfo: StoreInfo) {
        try {
            console.log(storeInfo.address)
            const { data } = await ghnApi.post('/shop/register', storeInfo);
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }


    static async getAllStore(query: QueryStore) {
        try {
            const { data } = await ghnApi.post('/shop/all', { params: query });
            return data.data;
        } catch (error) {
            console.error('Failed to get store:', error);
            throw error?.message;
        }
    }

    static convertOrder(order: Order) {

        let orderInfo: OrderCreateParam;
    }

    static async createOrder(orderId: number, shopId: number) {
        const order = await Order.createQueryBuilder('order')
            .leftJoinAndSelect('order.details', 'details')
            .where('order.id = :orderId AND order.isDeleted = false', { orderId })
            .getOne()

        let orderInfo = this.convertOrder(order)


        const ghnApi = axios.create({
            baseURL,
            headers: {
                'token': apiKey,
                'Content-Type': 'application/json',
                'ShopId': shopId
            },
        });
        try {
            const { data } = await ghnApi.post('/shipping-order/create', orderInfo);
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }

    static async updateOrder(orderInfo: OrderCreateParam, shopId: number) {
        const ghnApi = axios.create({
            baseURL,
            headers: {
                'token': apiKey,
                'Content-Type': 'application/json',
                'ShopId': shopId
            },
        });
        try {
            const { data } = await ghnApi.post('/shipping-order/update', orderInfo);
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }


    static async cancelOrder(orderCodes: OrderCodes, shopId: number) {
        const ghnApi = axios.create({
            baseURL,
            headers: {
                'token': apiKey,
                'Content-Type': 'application/json',
                'ShopId': shopId
            },
        });
        try {
            const { data } = await ghnApi.post('/switch-status/cancel', orderCodes);
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }


    static async returnOrder(orderCodes: OrderCodes, shopId: number) {
        const ghnApi = axios.create({
            baseURL,
            headers: {
                'token': apiKey,
                'Content-Type': 'application/json',
                'ShopId': shopId
            },
        });
        try {
            const { data } = await ghnApi.post('/switch-status/return', orderCodes);
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }



    static async printOrder(orderCodes: OrderCodes) {
        try {
            const { data } = await ghnApi.post('/a5/gen-token', orderCodes);
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }


    static async getOrderDetail(orderCode: string) {
        try {
            const { data } = await ghnApi.post('/shipping-order/detail', { order_code: orderCode });
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }


    static async deliveryAgain(orderCodes: string[], shopId: number) {
        const ghnApi = axios.create({
            baseURL,
            headers: {
                'token': apiKey,
                'Content-Type': 'application/json',
                'ShopId': shopId
            },
        });
        try {
            const { data } = await ghnApi.post('/switch-status/storing', { order_codes: orderCodes });
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }


    static async updateCOD(orderCodUpdate: OrderCodUpdate) {
        try {
            const { data } = await ghnApi.post('/shipping-order/updateCOD', orderCodUpdate);
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }

    static async getStation(query: QueryOffset) {
        try {
            const { data } = await ghnApi.post('/station/get', { query });
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }


    static async leadTime(leadTime: LeadTimeParams, shopId: number) {
        const ghnApi = axios.create({
            baseURL,
            headers: {
                'token': apiKey,
                'Content-Type': 'application/json',
                'ShopId': shopId
            },
        });
        try {
            const { data } = await ghnApi.post('shipping-order/leadtime', leadTime);
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }


    static async getOrderByClientOrderCode(clientOrderCode: string) {
        try {
            const { data } = await ghnApi.post('/shipping-order/detail-by-client-code', { client_order_code: clientOrderCode });
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }



    static async getShiftDate() {
        try {
            const { data } = await ghnApi.get('/shift/date');
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }


    static async previewOrder(order: OrderCreateParam, shopId: number) {
        const ghnApi = axios.create({
            baseURL,
            headers: {
                'token': apiKey,
                'Content-Type': 'application/json',
                'ShopId': shopId
            },
        });
        try {
            const { data } = await ghnApi.post('/shipping-order/preview', order);
            return data.data;
        } catch (error) {
            console.log(error.message)
            throw error?.message;
        }
    }


    static async getAllFeeOfOrder(orderCode: string, shopId: number) {
        const ghnApi = axios.create({
            baseURL,
            headers: {
                'token': apiKey,
                'Content-Type': 'application/json',
                'ShopId': shopId
            },
        });
        try {
            const { data } = await ghnApi.post('/shipping-order/soc', { order_code: orderCode });
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }



    static async caculateOrderFee(caculateOrderFee: CaculateOrderFee, shopId: number) {
        const ghnApi = axios.create({
            baseURL,
            headers: {
                'token': apiKey,
                'Content-Type': 'application/json',
                'ShopId': shopId
            },
        });
        try {
            const { data } = await ghnApi.post('/shipping-order/fee', caculateOrderFee);
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }


    static async getService(serviceParams: AvailableServicePrams) {
        try {
            const { data } = await ghnApi.post('/shipping-order/available-services', serviceParams);
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }



    static async getProvince() {
        const ghnApi = axios.create({
            baseURL: "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data",
            headers: {
                'token': apiKey,
                'Content-Type': 'application/json',
            },
        });
        try {
            const { data } = await ghnApi.get('/province');
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }

    static async getWard(districtId: number) {
        const ghnApi = axios.create({
            baseURL: "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data",
            headers: {
                'token': apiKey,
                'Content-Type': 'application/json',
            },
        });
        try {
            const { data } = await ghnApi.get(`/ward?district_id=${districtId}`);
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }


    static async getDistrict(provinceId: number) {
        const ghnApi = axios.create({
            baseURL: "https://dev-online-gateway.ghn.vn/shiip/public-api/master-data",
            headers: {
                'token': apiKey,
                'Content-Type': 'application/json',
            },
        });
        try {
            const { data } = await ghnApi.post(`/district?province_id=${provinceId}`);
            return data.data;
        } catch (error) {
            throw error?.message;
        }
    }

}
