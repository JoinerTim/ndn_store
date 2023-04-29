// IMPORT LIBRARY
import { Service } from "@tsed/common";

// IMPORT CUSTOM
import { Customer } from "../entity/Customer";
import { Password } from "../util/password";
import { ConfigurationService } from "./ConfigurationService";
import { AuthType, JWTSignedData } from "../middleware/auth/strategy/JWT";
import CONFIG from "../../config";
import jwt from 'jsonwebtoken';
import { BadRequest, Unauthorized } from "@tsed/exceptions";
import { QueryObject } from "../types/query";
import { escape } from "mysql2";
import { DeliveryStatus, OrderStatus } from "../types/order";
import { CustomerRank } from "../entity/CustomerRank";
import { LangCode } from "../types/language";
import { Multilingual } from "../util/multilingual";
import { Store } from "../entity/Store";
import { StoreService } from "./StoreService";

interface CustomerQuery {
    page: number;
    limit: number
    search?: string,
    isOwner?: boolean
    isDeleted?: boolean
    isBlocked?: boolean;
    isVerified?: boolean;
    queryObject?: string;
    customerRankId?: number;
    type?: 'NEW' | 'REGULAR' | 'RISK'
    storeId?: number
}

@Service()
export class CustomerService {

    constructor(
        private configurationService: ConfigurationService,
        private storeService: StoreService
    ) {

    }

    async getInfoByJwt(token: string) {
        if (!token) {
            throw new Unauthorized("Unauthorized!")
        }

        const decoded = <JWTSignedData>jwt.verify(token, CONFIG.JWT_SECRET)
        // console.log('decoded:', decoded)
        if (decoded.id && decoded.type == AuthType.Customer) {
            const customer = await Customer.findOne(decoded.id, {
                where: {
                    isDeleted: false
                }
            })

            if (!customer) {
                throw new Unauthorized("Tài khoản không tồn tại");
            }

            if (customer.isBlocked) {
                throw new Unauthorized("Tài khoản đã bị khóa");
            }
            return customer;

        } else {
            throw new Unauthorized("Unauthorized!")
        }

    }

    async getManyAndCount({
        page,
        limit,
        search = '',
        isOwner,
        isDeleted,
        isBlocked,
        isVerified,
        queryObject,
        customerRankId,
        type,
        storeId
    }: CustomerQuery) {
        let where = `customer.isDeleted = false AND CONCAT(customer.lastName,' ', customer.firstName,' ',customer.phone, ' ', customer.email) LIKE :search`

        if (isOwner === false) {
            where += ` AND shop.id is null`;
        }

        if (typeof isDeleted == 'boolean') {
            where += ` AND customer.isDeleted = :isDeleted`;
        }

        if (typeof isBlocked == 'boolean') {
            where += ` AND customer.isBlocked = :isBlocked`;
        }

        if (typeof isVerified == 'boolean') {
            where += ` AND customer.isVerified = :isVerified`;
        }

        if (customerRankId) {
            where += ` AND customerRank.id = :customerRankId`
        }

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        switch (type) {
            case 'NEW':
                where += ` AND (customer.lastOrderAt = 0 OR customer.cycleBuy = 0)`
                break;

            case 'REGULAR':
                where += ` AND (UNIX_TIMESTAMP() - customer.lastOrderAt) / 86400 <= customer.cycleBuy`;
                break;

            case 'RISK':
                where += ` AND (UNIX_TIMESTAMP() - customer.lastOrderAt) / 86400 > customer.cycleBuy`;
                break;

            default:
                break;
        }

        const query = Customer.createQueryBuilder('customer')
            .leftJoinAndSelect('customer.customerRank', 'customerRank')
            .leftJoinAndSelect('customer.city', 'city')
            .leftJoinAndSelect('customer.district', 'district')
            .leftJoinAndSelect('customer.ward', 'ward')
            .leftJoinAndSelect('customer.store', 'store')
            .leftJoinAndSelect('customer.refCustomer', 'refCustomer')
            .where(where, { search: `%${search}%`, isDeleted, isBlocked, isVerified, customerRankId, storeId })
            .skip((page - 1) * limit)
            .take(limit)


        let isHasOrderBy = false
        if (queryObject) {
            const object = JSON.parse(queryObject) as QueryObject[];
            if (!Array.isArray(object)) {
                throw new BadRequest("Query object is not valid");
            }

            for (const item of object) {
                if (item.type == 'sort') {
                    query.addOrderBy(`${item.field}`, item.value)

                    isHasOrderBy = true;
                }

                else if (item.type == 'single-filter') {
                    const value = escape(item.value)
                    query.andWhere(`${item.field} LIKE '%${value}%'`)
                }

                else if (item.type == 'multi-filter') {
                    const value = item.value.map(e => `${escape(e)}`).join(', ');
                    query.andWhere(`${item.field} IN (${value})`)
                }
            }
        }

        if (!isHasOrderBy) {
            query.addOrderBy('customer.id', 'DESC')
        }

        const [customers, total] = await query
            .getManyAndCount()
        return { customers, total };
    }

    async getOne(customerId: number) {
        const customer = await Customer.findOneOrThrowId(customerId, {
            relations: ['city', 'district', 'ward', 'customerRank']
        })
        return customer;
    }

    /**
     * map tỷ lệ bùng hàng
     */
    async mapStockUpRate(customers: Customer[] = []) {
        if (!customers.length) {
            return;
        }

        const data = await Customer.createQueryBuilder('customer')
            .select('customer.id', 'customerId')
            .addSelect(`SUM(IF(order.deliveryStatus = ${escape(DeliveryStatus.Fail)}, 1, 0))`, 'totalCancel')
            .addSelect('COUNT(*)', 'totalOrders')
            .innerJoin('customer.orders', 'order')
            .groupBy('customer.id')
            .where('customer.id IN (:...customerIds)', {
                customerIds: customers.map(e => e.id)
            })
            .getRawMany()

        for (const customer of customers) {
            const find = data.find(e => e.customerId == customer.id)
            customer.totalCancelOrders = find?.totalCancel || 0
            customer.totalOrders = find?.totalOrders || 0

            if (find?.totalOrders) {
                customer.stockUpRate = +(find.totalCancel / find.totalOrders).toFixed(1)
            } else {
                customer.stockUpRate = 0
            }
        }
    }

    /**
     * update lại rank khi update lại số điểm cần đạt
     */
    async updateRankWhenChangeReachedRank() {
        const customerRanks = await CustomerRank.find({
            where: {
                isDeleted: false
            }
        })

        for (let i = 0; i < customerRanks.length; i++) {
            const element = customerRanks[i];

            let where = 'customerRank'

            await Customer.createQueryBuilder('customer')
                .innerJoin('customer.customerRank', 'customerRank')
                .where(where)

        }
    }

    public async login(phone: string, password: string, store: Store, lang: LangCode = LangCode.Vi): Promise<Customer> {
        console.log('customer login :', phone, store)
        const customer = await Customer.findOneOrThrowOption({
            where: { phone: phone.trim(), isDeleted: false, store }
        }, 'Tài khoản');


        await this.validatePassword(customer, password, Multilingual.__('auth.wrongPassword', lang))

        if (customer.isBlocked) {
            throw new BadRequest(Multilingual.__('auth.accountBlocked', lang));
        }

        return customer
    }


    async validateDuplicate(customer: Customer, store: Store, customerId: number = null, lang: LangCode = LangCode.Vi,) {
        const { phone, googleId, facebookId, zaloId } = customer;


        let where = 'customer.isDeleted = 0 AND store.id = :storeId';
        let whereOR = 'customer.phone = :phone'

        if (customerId) {
            where += ` AND customer.id != :customerId`
        }

        if (googleId) {
            whereOR += ` OR customer.googleId = :googleId`
        }

        if (facebookId) {
            whereOR += ` OR customer..facebookId  = :facebookId`
        }

        if (zaloId) {
            whereOR += ` OR customer.zaloId = :zaloId`
        }


        const oldCustomer = await Customer.createQueryBuilder('customer')
            .leftJoinAndSelect('customer.store', 'store')
            .where(where, {
                customerId,
                storeId: store.id
            })
            .andWhere(`(${whereOR})`, {
                phone,
                googleId,
                facebookId,
                zaloId
            })
            .getOne()


        if (oldCustomer) {
            let message = ""

            if (oldCustomer.phone == phone && phone) {
                message = Multilingual.__('phone', lang)
            }

            if (oldCustomer.facebookId == facebookId && facebookId) {
                message = Multilingual.__('facebookAccount', lang)
            }

            if (oldCustomer.googleId == googleId && googleId) {
                message = Multilingual.__('facebookAccount', lang)
            }

            if (oldCustomer.zaloId == zaloId && zaloId) {
                message = Multilingual.__('zaloAccount', lang)
            }

            if (message) {
                throw new BadRequest(Multilingual.__('auth.hasRegistered', lang, { name: message }))
            }
        }
    }


    async validatePassword(customer: Customer, password: string, msg = 'Mật khẩu không đúng') {
        const customerWithPassword = await Customer.findOneOrThrowOption({
            where: { id: customer.id },
            select: ['id', 'password']
        })

        const validate = await Password.validate(password, customerWithPassword.password)
        if (!validate) {
            throw new BadRequest(msg)
        }
    }

} // END FILE
