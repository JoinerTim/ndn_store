import { Request, Response, UseBefore } from "@tsed/common";
import { useDecorators } from "@tsed/core";
import { compare } from "compare-versions";
import md5 from "md5";
import moment from "moment";
import CONFIG from "../../../config";


export const UseAuthHash = () => {
    return useDecorators(
        UseBefore((req: Request, res: Response, next: any) => {

            // const isDev = req.headers['is-dev'] as any as boolean;

            // if (CONFIG.ENV == 'staging' || CONFIG.ENV == 'development') {
            //     return next();
            // }

            // const hash = req.headers['hash'] || '' as any as string
            // console.log('hash header:', hash)
            // const time = +req.headers['time'] || 0 as any as number
            // console.log('time header:', time)

            // const isValid = validateHash({
            //     hash, time
            // });

            // if (!isValid) {
            //     return res.sendForbidden("Request is not valid. Your IP will be tracking");
            // }

            next();
        })
    );
}


/**
 * 
 * @returns true: valid
 */
export const validateHash = ({
    time, hash
}) => {
    if (!hash || !time) {
        return false;
    }

    const current = moment();
    const diff = current.diff(moment.unix(time), 'seconds')
    console.log('diffMinutes:', diff)

    if (diff > 10) {
        return false
    }

    const hashMd5 = generateHash(time)

    if (hashMd5 != hash) {
        return false
    }

    return true;
}

export const generateHash = (time: number) => {
    const string = `${CONFIG.AUTH_KEY}.${time}`

    const hashMd5 = md5(string)
    return hashMd5;
}