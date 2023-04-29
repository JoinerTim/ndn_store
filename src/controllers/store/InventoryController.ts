// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams, BodyParams, Post, Patch, Delete } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';
import { Enum } from '@tsed/schema';



// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Warehouse } from '../../entity/Warehouse';
import { Inventory, InventoryStatus, InventoryType } from '../../entity/Inventory';
import { InventoryDetail } from '../../entity/InventoryDetail';
import moment from 'moment';
import { BadRequest } from '@tsed/exceptions';
import { InventoryService } from '../../services/InventoryService';


@Controller("/store/inventory")
@Docs("docs_store")
export class InventoryController {
    constructor(
        private inventoryService: InventoryService
    ) {

    }

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
        @QueryParams('depotId') depotId: number,
        @QueryParams('type') @Enum(InventoryType) type: InventoryType,
        @QueryParams('status') @Enum(InventoryStatus) status: InventoryStatus,
        @QueryParams('productId') productId: number,
        @QueryParams('fromAt') fromAt: number,
        @QueryParams('toAt') toAt: number,
        @QueryParams('employeeId') employeeId: number,
        @QueryParams('queryObject') queryObject: string,
        @QueryParams('ignoreChangeInventory') ignoreChangeInventory: boolean,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { inventories, total } = await this.inventoryService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id,
            depotId,
            type,
            status,
            productId,
            fromAt,
            toAt,
            employeeId,
            queryObject,
            ignoreChangeInventory
        });

        return res.sendOK({ inventories, total });
    }

    @Get('/:inventoryId')
    @UseAuth(VerificationJWT)
    @Validator({
        inventoryId: Joi.required()
    })
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('inventoryId') inventoryId: number
    ) {
        const inventory = await this.inventoryService.getOne(inventoryId, req.store)
        return res.sendOK(inventory)
    }


    @Post('/')
    @UseAuth(VerificationJWT)
    @Validator({
        inventory: Joi.required(),
        depotId: Joi.number().required(),
        inventoryDetails: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("inventory") inventory: Inventory,
        @BodyParams("inventoryDetails", InventoryDetail) inventoryDetails: InventoryDetail[],
        @BodyParams("depotId") depotId: number,
    ) {
        const data = await this.inventoryService.createOrUpdate({ inventory, inventoryDetails, store: req.store, depotId, employee: req.employee })
        return res.sendOK(data)
    }

    @Patch('/:inventoryId/complete')
    @UseAuth(VerificationJWT)
    @Validator({
        inventoryId: Joi.number().required(),
    })
    async updateComplete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("inventoryId") inventoryId: number,
    ) {
        const inventory = await Inventory.findOneOrThrowOption({
            where: { id: inventoryId, store: req.store },
            relations: ["depot", "depot.warehouses", "inventoryDetails", "inventoryDetails.product"]
        })
        if (inventory.type !== InventoryType.Import || inventory.status === InventoryStatus.Complete) {
            throw new BadRequest("Phiếu nhập kho không hợp lệ.")
        }

        const data = await Promise.all(inventory.inventoryDetails.map(async (item) => {

            const warehouse = await Warehouse.createQueryBuilder('warehouse')
                .leftJoinAndSelect('warehouse.product', 'product')
                .where('product.id = :productId', { productId: item.product.id })
                .getOne()

            item.stock = warehouse.quantity
            await item.save()
            warehouse.quantity += item.quantity

            if (warehouse.quantity + item.quantity > 0) {
                warehouse.isOutOfStock = false
            }

            return warehouse
        }))

        await Warehouse.save(data)

        inventory.status = InventoryStatus.Complete
        inventory.completedAt = moment().unix()
        inventory.completedEmployee = req.employee
        inventory.id = +inventoryId;

        await inventory.save()

        return res.sendOK(inventory)
    }

    @Patch('/:inventoryId/export/complete')
    @UseAuth(VerificationJWT)
    @Validator({
        inventoryId: Joi.number().required(),
    })
    async updateExportComplete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("inventoryId") inventoryId: number,
    ) {
        const inventory = await Inventory.findOneOrThrowOption({
            where: { id: inventoryId, store: req.store },
            relations: ["depot", "depot.warehouses", "inventoryDetails", "inventoryDetails.product"]
        })
        if (inventory.type !== InventoryType.Export || inventory.status === InventoryStatus.Complete) {
            throw new BadRequest("Phiếu xuất kho không hợp lệ.")
        }

        const data = await Promise.all(inventory.inventoryDetails.map(async (item) => {
            const warehouse = await Warehouse.createQueryBuilder('warehouse')
                .leftJoinAndSelect('warehouse.product', 'product')
                .where('product.id = :productId', { productId: item.product.id })
                .getOne()

            if (warehouse.quantity >= item.quantity) {
                item.stock = warehouse.quantity
                await item.save()
                if (warehouse.quantity - item.quantity == 0) {
                    warehouse.isOutOfStock = true
                } else {
                    warehouse.isOutOfStock = false
                }
                warehouse.quantity -= item.quantity
            } else {
                throw new BadRequest("Số lượng không hợp lệ.")
            }
            return warehouse
        }))

        await Warehouse.save(data)

        inventory.status = InventoryStatus.Complete
        inventory.completedAt = moment().unix()
        inventory.completedEmployee = req.employee
        inventory.id = +inventoryId;

        await inventory.save()

        return res.sendOK(inventory)
    }



    @Patch('/:inventoryId')
    @UseAuth(VerificationJWT)
    @Validator({
        inventoryId: Joi.number().required(),
        inventory: Joi.required(),
        depotId: Joi.number().required(),
        inventoryDetails: Joi.required(),
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("inventoryId") inventoryId: number,
        @BodyParams("inventory") inventory: Inventory,
        @BodyParams("inventoryDetails", InventoryDetail) inventoryDetails: InventoryDetail[],
        @BodyParams("depotId") depotId: number,
    ) {
        const data = await this.inventoryService.createOrUpdate({ inventory, inventoryDetails, store: req.store, depotId, inventoryId, employee: req.employee })
        return res.sendOK(data)
    }


    @Delete('/:inventoryId')
    @UseAuth(VerificationJWT)
    @Validator({
        inventoryId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("inventoryId") inventoryId: number,
    ) {

        const inventory = await Inventory.findOneOrThrowOption({ where: { id: inventoryId, store: req.store } })
        inventory.isDeleted = true

        await inventory.save()

        return res.sendOK(inventory)
    }


} // END FILE
