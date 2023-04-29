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
import { InventoryCheckService } from '../../services/InventoryCheckService';
import { InventoryCheck, InventoryCheckStatus } from '../../entity/InventoryCheck';
import { InventoryCheckDetail } from '../../entity/InventoryCheckDetail';


@Controller("/store/inventoryCheck")
@Docs("docs_store")
export class InventoryCheckController {
    constructor(
        private inventoryCheckService: InventoryCheckService
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
        @QueryParams('status') @Enum(InventoryStatus) status: InventoryStatus,
        @QueryParams('fromAt') fromAt: number,
        @QueryParams('toAt') toAt: number,
        @QueryParams('createdEmployeeId') createdEmployeeId: number,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { inventoryChecks, total } = await this.inventoryCheckService.getManyAndCount({
            limit,
            search,
            page,
            storeId: req.store.id,
            depotId,
            status,
            fromAt,
            toAt,
            createdEmployeeId
        });

        return res.sendOK({ inventoryChecks, total });
    }

    @Get('/:inventoryCheckId')
    @UseAuth(VerificationJWT)
    @Validator({
        inventoryCheckId: Joi.required()
    })
    async findOne(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams('inventoryCheckId') inventoryCheckId: number
    ) {
        const inventory = await this.inventoryCheckService.getOne(inventoryCheckId, req.store)
        return res.sendOK(inventory)
    }


    @Post('/')
    @UseAuth(VerificationJWT)
    @Validator({
        inventoryCheck: Joi.required(),
        depotId: Joi.number().required(),
        inventoryCheckDetails: Joi.required(),
    })
    async create(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams("inventoryCheck") inventoryCheck: InventoryCheck,
        @BodyParams("inventoryCheckDetails", InventoryCheckDetail) inventoryCheckDetails: InventoryCheckDetail[],
        @BodyParams("depotId") depotId: number,
    ) {
        const data = await this.inventoryCheckService.createOrUpdate({ inventoryCheck, inventoryCheckDetails, store: req.store, depotId, employee: req.employee })
        return res.sendOK(data)
    }

    @Patch('/:inventoryCheckId/complete')
    @UseAuth(VerificationJWT)
    @Validator({
        inventoryCheckId: Joi.number().required(),
    })
    async updateComplete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("inventoryCheckId") inventoryCheckId: number,
    ) {
        const inventoryCheck = await InventoryCheck.findOneOrThrowOption({
            where: { id: inventoryCheckId, store: req.store },
            relations: ["depot", "depot.warehouses", "inventoryCheckDetails", "inventoryCheckDetails.product"]
        })

        const data = await Promise.all(inventoryCheck.inventoryCheckDetails.map(async (item) => {

            await item.save()
            const warehouse = await Warehouse.createQueryBuilder('warehouse')
                .leftJoinAndSelect('warehouse.product', 'product')
                .where('product.id = :productId', { productId: item.product.id })
                .getOne()

            const inventory = new Inventory()
            inventory.status = InventoryStatus.Complete
            inventory.note = `Auto generated when create inventory check`
            inventory.employee = req.employee
            inventory.completedEmployee = req.employee
            inventory.store = req.store
            inventory.depot = inventoryCheck.depot

            const inventoryDetail = new InventoryDetail()
            inventoryDetail.stock = warehouse.quantity
            inventoryDetail.price = warehouse.product.importPrice
            inventoryDetail.note = `Auto generated when create inventory check`
            inventoryDetail.product = warehouse.product

            if (warehouse.quantity < item.quantity) {
                inventoryDetail.quantity = item.quantity - warehouse.quantity
                inventory.type = InventoryType.Import
            } else if (warehouse.quantity > item.quantity) {
                inventoryDetail.quantity = warehouse.quantity - item.quantity
                inventory.type = InventoryType.Export
            }

            inventory.completedAt = moment().unix()
            await inventory.generateCode()

            await inventoryDetail.save()
            inventory.inventoryDetails = [inventoryDetail]

            warehouse.quantity = item.quantity
            if (item.quantity === 0) {
                warehouse.isOutOfStock = true
            }
            else {
                warehouse.isOutOfStock = false
            }
            await inventory.save()
            return warehouse
        }))


        await Warehouse.save(data)

        inventoryCheck.status = InventoryCheckStatus.Complete
        inventoryCheck.checkAt = moment().unix()
        inventoryCheck.checkedEmployee = req.employee
        inventoryCheck.id = +inventoryCheckId;

        await inventoryCheck.save()

        return res.sendOK(inventoryCheck)
    }


    @Patch('/:inventoryCheckId')
    @UseAuth(VerificationJWT)
    @Validator({
        inventoryCheckId: Joi.number().required(),
        inventoryCheck: Joi.required(),
        depotId: Joi.number().required(),
        inventoryCheckDetails: Joi.required(),
    })
    async update(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("inventoryCheckId") inventoryCheckId: number,
        @BodyParams("inventoryCheck") inventoryCheck: InventoryCheck,
        @BodyParams("inventoryCheckDetails", InventoryCheckDetail) inventoryCheckDetails: InventoryCheckDetail[],
        @BodyParams("depotId") depotId: number,
    ) {
        const data = await this.inventoryCheckService.createOrUpdate({ inventoryCheck, inventoryCheckDetails, store: req.store, depotId, inventoryCheckId, employee: req.employee })
        return res.sendOK(data)
    }


    @Delete('/:inventoryCheckId')
    @UseAuth(VerificationJWT)
    @Validator({
        inventoryCheckId: Joi.number().required()
    })
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @PathParams("inventoryCheckId") inventoryCheckId: number,
    ) {

        const inventoryCheck = await InventoryCheck.findOneOrThrowOption({ where: { id: inventoryCheckId, store: req.store } })
        inventoryCheck.isDeleted = true

        await inventoryCheck.save()

        return res.sendOK(inventoryCheck)
    }


} // END FILE
