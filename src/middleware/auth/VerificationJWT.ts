import { Context, Middleware, MiddlewareMethods, Req } from "@tsed/common";
import { Request } from 'express';

import Verification from "./Verification";
import JWT from "./strategy/JWT";

@Middleware()
export class VerificationJWT implements MiddlewareMethods {
    public async use(
        @Context() $ctx: Context
    ) {
        const verification = new Verification(new JWT())
        await verification.auth($ctx.getRequest())
    }
}
