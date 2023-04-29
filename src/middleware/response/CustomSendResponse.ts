import { ResponseFilter, Context, ResponseFilterMethods } from "@tsed/common";
import { isStream } from "@tsed/core";



@ResponseFilter("application/json")
export class WrapperResponseFilter implements ResponseFilterMethods {
    transform(data: any, ctx: Context) {
        data = ctx.data

        let message = ""
        if (data && data.message) {
            message = data.message
            delete data.message
        }

        if (data === undefined) {

            return {}
        }

        const payload = {
            data,
            message,
            status: true
        };

        return payload;
    }
}