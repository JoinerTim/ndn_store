// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams, BodyParams, Post, Patch, Delete } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { Warehouse } from '../../entity/Warehouse';
import { WarehouseService } from '../../services/WarehouseService';
import { Product } from '../../entity/Product';
import { ProductCustomFieldInsert } from '../../entity-request/ProductCustomFieldInsert';
import { ProductService } from '../../services/ProductService';
import { BadRequest } from '@tsed/exceptions';
import { Depot } from '../../entity/Depot';


@Controller("/store/warehouse")
@Docs("docs_store")
export class WarehouseController {
    constructor(
        private warehouseService: WarehouseService,
        private productService: ProductService
    ) { }


} // END FILE
