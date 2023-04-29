// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";
import { Employee } from "../entity/Employee";


// IMPORT CUSTOM
import { Store } from "../entity/Store";
import JWT, { AuthType } from "../middleware/auth/strategy/JWT";
import { UserType } from "../types/user";
import { Password } from "../util/password";
import { ConfigurationService } from "./ConfigurationService";
import { ContentDefineService } from "./ContentDefineService";
import { CouponCampaignService } from "./CouponCampaignService";
import { CustomFieldService } from "./CustomFieldService";
import { DepotService } from "./DepotService";
import { ShipFeeService } from "./ShipFeeService";
import { RoleService } from "./RoleService";
import { PermissionImport } from "../entity-request/PermissionImport";
import { BenefitPackageOrder } from "../entity/BenefitPackageOrder";
import { Role } from "../entity/Role";
import { BenefitPackage } from "../entity/BenefitPackage";
import { SessionDeviceService } from "./SessionDeviceService";

interface StoreQuery {
    page: number;
    limit: number
    search?: string
    areaId?: number
    cityId?: number
}

interface CreateStoreParams {
    store: Store,
    password: string,
    createdBy?: UserType.Admin
    cityId?: number;
    districtId?: number;
    wardId?: number;
    benefitPackageId: number;
}

@Service()
export class StoreService {

    constructor(
        private customFieldService: CustomFieldService,
        private shipFeeService: ShipFeeService,
        private depotService: DepotService,
        private contentDefineService: ContentDefineService,
        private couponCampaignService: CouponCampaignService,
        private configurationService: ConfigurationService,
        private roleService: RoleService,
        private sessionDeviceService: SessionDeviceService
    ) {

    }

    async create({
        store, password, createdBy = UserType.Admin, cityId, districtId, wardId, benefitPackageId
    }: CreateStoreParams) {

        await this.validate(store, null);
        await store.generateCode()
        if (benefitPackageId) {
            await store.assignBenefitPackage(benefitPackageId) // create benefit package order for store

        }
        cityId && await store.assignCity(cityId)
        districtId && await store.assignDistrict(districtId)
        wardId && await store.assignWard(wardId)
        store.createdBy = createdBy;

        //init employee
        const employee = new Employee()
        employee.username = store.namespace;
        employee.name = store.name;
        employee.phone = store.phone
        employee.password = await Password.hash(password);
        const storeSaved = await store.save()

        if (benefitPackageId) {
            const benefitPackageOrder = new BenefitPackageOrder()
            benefitPackageOrder.store = storeSaved
            await benefitPackageOrder.assignBenefitPackage(benefitPackageId)
            await benefitPackageOrder.save()
        }

        //create role = "ADMIN" and assign to employee admin
        const permissionOfPackage = await BenefitPackage.createQueryBuilder('benefitPackage')
            .leftJoinAndSelect('benefitPackage.permissions', 'permissions')
            .where('benefitPackage.id = :benefitPackageId', { benefitPackageId })
            .getOne()

        const permissions = permissionOfPackage?.permissions || []

        const role = await this.roleService.initRole('ADMIN', 'Quản lý tất cả chức năng', store, permissions, true)

        employee.role = role
        employee.store = store;
        employee.isAdmin = true;

        await employee.save()

        //custom field
        await this.customFieldService.initForStore(store);

        //ship fee
        await this.shipFeeService.init(store);

        //depot
        await this.depotService.create({
            name: `Kho của CH ${store.name}`,
            code: '',
            store
        })

        //init content define
        await this.contentDefineService.initForStore(store);

        //init coupon
        await this.couponCampaignService.init(store);

        //init configuration
        await this.configurationService.init(store);

        return store;
    }

    async login(username: string, password: string, namespace: string, deviceId: string, deviceName: string, ipAddress: string) {
        const store = await Store.findOneOrThrowOption({
            where: {
                namespace
            }
        }, 'Cửa hàng');

        const employee = await Employee.createQueryBuilder('employee')
            .select('employee.id', 'id')
            .addSelect('employee.password', 'password')
            .leftJoin('employee.store', 'store')
            .where('employee.isDeleted = 0 AND employee.username = :username AND store.namespace = :namespace', {
                username,
                namespace
            })
            .getRawOne()

        if (!employee) {
            throw new BadRequest("Tài khoản không tồn tại");
        }

        const isValidPwd = await Password.validate(password, employee.password);

        if (!isValidPwd) {
            throw new BadRequest("Tài khoản hoặc mật khẩu sai");
        }

        if (employee.isBlocked) {
            throw new BadRequest("Tài khoản đã bị khóa");
        }


        await Employee.createQueryBuilder()
            .update()
            .set({
                deviceId
            })
            .where('id = :id', {
                id: employee.id
            })
            .execute();

        const employeeEntity = await Employee.findOneOrThrowId(employee.id, null, '');
        this.sessionDeviceService.create({
            employee: employeeEntity,
            store,
            deviceId,
            deviceName,
            ipAddress
        })


        const token = JWT.sign({
            id: employee.id,
            storeId: store.id,
            type: AuthType.Store,
            namespace: store.namespace
        })

        return token;

    }

    async getManyAndCount({
        page,
        limit,
        search = '',
        areaId,
        cityId
    }: StoreQuery) {
        let where = `store.name LIKE :search AND store.isDeleted = false`;

        if (areaId) {
            where += ` AND area.id = :areaId`
        }

        if (cityId) {
            where += ` AND city.id = :cityId`
        }

        const [stores, total] = await Store.createQueryBuilder('store')
            .leftJoinAndSelect('store.area', 'area')
            .leftJoinAndSelect('store.city', 'city')
            .leftJoinAndSelect('store.district', 'district')
            .leftJoinAndSelect('store.benefitPackage', 'benefitPackage')
            .leftJoinAndSelect('store.ward', 'ward')
            .where(where, { search: `%${search}%`, areaId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('store.id', 'DESC')
            .getManyAndCount()

        return { stores, total }
    }

    async findByNamespace(namespace: string) {
        const store = await Store.findOneOrThrowOption({
            where: {
                namespace,
                isDeleted: false
            }
        }, 'Namespace')

        return store
    }

    async getOne(storeId: number) {
        const store = await Store.findOneOrThrowId(storeId, {
            relations: ['area', 'city', 'district', 'ward']
        })
        return store
    }


    async init() {
        const stores = await Store.find({})

        for (let store of stores) {

            //init content define
            await this.contentDefineService.initForStore(store);

            //init coupon
            await this.couponCampaignService.init(store);

            //init configuration
            await this.configurationService.init(store);

        }
    }

    async validate(store: Store, storeId: number = null) {
        const {
            namespace
        } = store;


        let where = 'store.isDeleted = 0 AND store.namespace = :namespace'
        if (storeId) {
            where += ` AND store.id != ${storeId}`
        }

        const otherStore = await Store.createQueryBuilder('store')
            .where(where, { namespace })
            .getOne()

        if (otherStore) {
            if (otherStore.namespace == namespace) {
                throw new BadRequest("Namespace đã tồn tại");
            }
        }
    }

} //END FILE
