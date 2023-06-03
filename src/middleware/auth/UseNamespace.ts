import { Request, UseBefore } from "@tsed/common"
import { useDecorators } from "@tsed/core"
import { BadRequest } from "@tsed/exceptions";
import { NextFunction } from "express";
import { Store } from "../../entity/Store";



export const UseNamespace = () => {
    return useDecorators(
        UseBefore(async (req: Request, res: Response, next: NextFunction) => {
            const namespace = req.headers['namespace'];
            console.log('namespace:', namespace)

            const store = await Store.findOne({
                where: {
                    namespace: 'ndnstore',
                    isDeleted: false
                }
            })

            if (!store) {
                return next(new BadRequest("Namespace không tồn tại."))
            }

            req.store = store;
            next();
        }))
}