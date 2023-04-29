import Request from 'request-promise'
import logger from './logger';
import CONFIG from '../../config';
import { chunk } from "lodash";

type OneSignalUserType = 'admin' | 'store' | 'client';

interface IPushNotificationParams {
    heading: string,
    content: string,
    oneSignalPlayerIds: string[],
    data: any,
    pathUrl?: string,
    userType?: OneSignalUserType
}

interface PushNotificationAllParams {
    content: string
    heading: string
    url?: string
    data?: any
    userType?: OneSignalUserType
}

export class OneSignalUtil {

    static getConfig(userType: OneSignalUserType) {
        let restApiKey = '', appId = '', callbackUrl = ''

        switch (userType) {
            case 'admin':
                restApiKey = CONFIG.ONE_SIGNAL_REST_API_KEY
                appId = CONFIG.ONE_SIGNAL_APP_ID
                callbackUrl = CONFIG.ONE_SIGNAL_URL_CB
                break;

            case 'store':
                restApiKey = CONFIG.ONE_SIGNAL_STORE_REST_API_KEY
                appId = CONFIG.ONE_SIGNAL_STORE_APP_ID
                callbackUrl = CONFIG.ONE_SIGNAL_STORE_URL_CB
                break;

            case 'client':
                restApiKey = CONFIG.ONE_SIGNAL_CLIENT_REST_API_KEY
                appId = CONFIG.ONE_SIGNAL_CLIENT_APP_ID
                callbackUrl = CONFIG.ONE_SIGNAL_CLIENT_URL_CB
                break;

            default:
                return
        }

        return {
            restApiKey, appId, callbackUrl
        }
    }

    static async pushNotification({
        heading, content, oneSignalPlayerIds, data, pathUrl = '/', userType = 'admin'
    }: IPushNotificationParams) {
        const {
            appId, callbackUrl, restApiKey
        } = this.getConfig(userType)

        const chunkArray = chunk(oneSignalPlayerIds, 1000)
        for (const itemChunk of chunkArray) {
            const response = await Request({
                method: 'POST',
                uri: 'https://onesignal.com/api/v1/notifications',
                headers: {
                    "Authorization": `Basic ${restApiKey}`
                },
                body: {
                    app_id: appId,
                    contents: { "en": content },
                    headings: { "en": heading },
                    include_player_ids: itemChunk,
                    url: callbackUrl + pathUrl,
                    data
                },
                json: true
            })

            console.log('one signal response', response);

            // console.log('response:', JSON.parse(response))
            // logger('info').info(`Success - Sent notification with content: ${content}.`)
        }


    }

    static async pushNotificationAll({ content, heading, url, data, userType = 'admin' }: PushNotificationAllParams) {
        try {
            const {
                appId, callbackUrl, restApiKey
            } = this.getConfig(userType)

            const response = await Request({
                method: 'POST',
                uri: 'https://onesignal.com/api/v1/notifications',
                headers: {
                    "Authorization": `Basic ${restApiKey}`
                },
                body: {
                    app_id: appId,
                    contents: { "en": content },
                    headings: { "en": heading },
                    included_segments: ["All"],
                    url: callbackUrl + url,
                    data
                },
                json: true
            })
            logger('info').info(`Success - Sent notification with content: ${content}.`)
        } catch (error) {
            logger('error').error(`Fail - Sent notification with content: ${content}.`)
        }
    }
}

