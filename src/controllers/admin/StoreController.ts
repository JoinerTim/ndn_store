// IMPORT LIBRARY
import { Controller, Post, UseAuth, Req, Request, Res, Response, HeaderParams, BodyParams, Get, PathParams, QueryParams, Delete, Patch } from '@tsed/common';
import { Docs } from '@tsed/swagger';
import Joi from '@hapi/joi';


// IMPORT CUSTOM
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Validator } from '../../middleware/validator/Validator';
import { Store } from '../../entity/Store';
import { StoreService } from '../../services/StoreService';
import { DepotService } from '../../services/DepotService';
import { Product } from '../../entity/Product';
import { ShipFeeService } from '../../services/ShipFeeService';
import { Forbidden } from '@tsed/exceptions';
import { PermissionImport } from '../../entity-request/PermissionImport';
import { BenefitPackageOrder } from '../../entity/BenefitPackageOrder';
import { Depot } from '../../entity/Depot';
import { Warehouse } from '../../entity/Warehouse';
import { Inventory, InventoryStatus, InventoryType } from '../../entity/Inventory';
import { InventoryDetail } from '../../entity/InventoryDetail';
import { Employee } from '../../entity/Employee';
import moment from "moment"
import { BenefitPackage } from '../../entity/BenefitPackage';
import { Role } from '../../entity/Role';
import { Permission } from '../../entity/Permission';
import { RoleService } from '../../services/RoleService';

@Controller("/admin/store")
@Docs("docs_admin")
export class StoreController {
    constructor(
        private storeService: StoreService,
        private depotService: DepotService,
        private shipFeeService: ShipFeeService,
        private roleService: RoleService
    ) { }


    // =====================GET LIST=====================
    @Get('')
    @UseAuth(VerificationJWT)
    @Validator({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(100)
    })
    async findAll(
        @HeaderParams("token") token: string,
        @QueryParams("page") page: number = 1,
        @QueryParams("limit") limit: number = 10,
        @QueryParams("search") search: string = "",
        @QueryParams('areaId') areaId: number,
        @QueryParams('cityId') cityId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { stores, total } = await this.storeService.getManyAndCount({
            limit,
            search,
            page,
            areaId,
            cityId
        })

        return res.sendOK({ stores, total });
    }

    // =====================CREATE ITEM=====================
    @Post('')
    @UseAuth(VerificationJWT)
    @Validator({
        store: Joi.required(),
        cityId: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("store") store: Store,
        @BodyParams('namespace') namespace: string,
        @BodyParams('password') password: string,
        @BodyParams('areaId') areaId: number,
        @BodyParams('cityId') cityId: number,
        @BodyParams('districtId') districtId: number,
        @BodyParams('wardId') wardId: number,
        @BodyParams('benefitPackageId') benefitPackageId: number,
    ) {
        store.namespace = namespace;
        await this.storeService.create({
            store, password, cityId, districtId, wardId, benefitPackageId
        })
        return res.sendOK(store)
    }


    @Post('/store/init/product/depot')
    @UseAuth(VerificationJWT)
    async initProductDepot(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const products = await Product.createQueryBuilder('product')
            .leftJoinAndSelect('product.store', 'store')
            .leftJoinAndSelect('product.warehouses', 'warehouses')
            .where('product.isDeleted = false AND warehouses.id is null AND store.id is not null')
            .getMany()

        await Promise.all(products.map(async (product) => {
            let depot = await Depot.createQueryBuilder('depot')
                .leftJoinAndSelect('depot.store', 'store')
                .where('store.id = :storeId', { storeId: product.store.id })
                .getOne()

            const employee = await Employee.createQueryBuilder('employee')
                .leftJoinAndSelect('employee.store', 'store')
                .where('employee.isAdmin = true AND employee.isDeleted = false AND employee.isBlocked = false')
                .getOne()

            if (!depot) {
                depot = await this.depotService.create({
                    name: `Kho của CH ${product.store.name}`,
                    code: '',
                    store: product.store
                })
            }
            const warehouse = new Warehouse()
            warehouse.minimumStock = 100
            warehouse.isOutOfStock = false
            warehouse.depot = depot
            warehouse.pending = 0
            warehouse.quantity = 200
            warehouse.product = product
            await warehouse.save()

            const inventory = new Inventory()
            inventory.type = InventoryType.Import
            await inventory.generateCode()
            inventory.note = "Auto generated when init product"
            inventory.status = InventoryStatus.Complete
            inventory.employee = employee
            inventory.depot = depot
            inventory.completedAt = moment().unix()
            inventory.completedEmployee = employee

            const inventoryDetail = new InventoryDetail()
            inventoryDetail.note = `Auto generated when init product`
            inventoryDetail.price = product.importPrice || 0
            inventoryDetail.product = product
            inventoryDetail.quantity = 200
            inventoryDetail.stock = 0
            await inventoryDetail.save()

            inventory.inventoryDetails = [inventoryDetail]
            inventory.store = product.store
            await inventory.save()

        }))

        return res.sendOK({})
    }


    // =====================UPDATE ITEM=====================
    @Patch('/:storeId')
    @UseAuth(VerificationJWT)
    @Validator({
        store: Joi.required(),
        storeId: Joi.number().required()
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("store") store: Store,
        @BodyParams('areaId') areaId: number,
        @PathParams("storeId") storeId: number,
        @BodyParams('cityId') cityId: number,
        @BodyParams('districtId') districtId: number,
        @BodyParams('wardId') wardId: number,
        @BodyParams('benefitPackageId') benefitPackageId: number,
    ) {
        const oldStore = await Store.findOneOrThrowId(storeId)

        await this.storeService.validate(store, storeId)

        if (areaId) await store.assignArea(areaId)

        if (cityId) await store.assignCity(cityId)

        if (districtId) await store.assignDistrict(districtId)

        if (wardId) await store.assignWard(wardId)

        if (benefitPackageId) {
            const benefitPackage = await BenefitPackage.createQueryBuilder('benefitPackage')
                .leftJoinAndSelect('benefitPackage.stores', 'stores')
                .leftJoinAndSelect('benefitPackage.permissions', 'permissions')
                .where('benefitPackage.isDeleted = false AND benefitPackage.id = :benefitPackageId', { benefitPackageId })
                .getOne()

            const rolesAdmin = await Role.createQueryBuilder('role')
                .leftJoinAndSelect('role.store', 'store')
                .leftJoinAndSelect('role.permissions', 'permissions')
                .where('store.id = :storeId AND role.isAdmin = true AND role.isDeleted = false', { storeId })
                .getOne()

            const employeeAdmin = await Employee.createQueryBuilder('employee')
                .leftJoinAndSelect('employee.store', 'store')
                .where('employee.isDeleted = false AND employee.isAdmin = true AND store.id = :storeId', { storeId })
                .getOne()

            if (!rolesAdmin) {
                const permissions = benefitPackage?.permissions || []
                const newRole = await this.roleService.initRole('ADMIN', 'Quản lý tất cả chức năng', oldStore, permissions, true)
                employeeAdmin.role = newRole
                await employeeAdmin.save()
            }

            // create benefit package order for store
            const benefitPackageOrder = new BenefitPackageOrder()
            benefitPackageOrder.price = benefitPackage.price
            await benefitPackageOrder.assignStore(storeId)
            await benefitPackageOrder.assignBenefitPackage(benefitPackageId)
            await benefitPackageOrder.save()
            await store.assignBenefitPackage(benefitPackageId)

        }

        store.id = +storeId

        await store.save()

        return res.sendOK(store)
    }

    @Post('/init')
    @UseAuth(VerificationJWT)
    async init(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        await this.storeService.init()
        return res.sendOK({})
    }

    // =====================UPDATE ITEM=====================
    @Delete('/:storeId')
    @UseAuth(VerificationJWT)
    @Validator({
        storeId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("storeId") storeId: number,
    ) {
        const store = await Store.findOneOrThrowId(storeId)
        store.deletedBy = req.staff;
        await store.delete();
        return res.sendOK(store)
    }


} // END FILE
