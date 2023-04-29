import {
	Controller,
	UseAuth,
	Req,
	Get,
	Res,
	Response,
	HeaderParams,
	PathParams,
	Post,
	BodyParams,
	Patch,
} from "@tsed/common";
import Joi from "@hapi/joi";
import { Docs } from "@tsed/swagger";
import { Request } from "express";

import { Validator } from "../../middleware/validator/Validator";
import { VerificationJWT } from "../../middleware/auth/VerificationJWT";
import { Role } from "../../entity/Role";
import { RoleService } from "../../services/RoleService";
import { Permission } from "../../entity/Permission";
import { PermissionImport } from "../../entity-request/PermissionImport";
import { StorePermission } from "../../entity/StorePermission";
import { Employee } from "../../entity/Employee";
import { BadRequest } from "@tsed/exceptions";


@Controller("/store/permission")
@Docs("docs_store")
export class PermissionController {

} // END FILE
