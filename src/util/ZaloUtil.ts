import axios from "axios";
import CONFIG from "../../config";

export class ZaloUtil {

    static async getUserProfile(accessToken: string, token: string) {
        const res = await axios.get('https://graph.zalo.me/v2.0/me/info', {
            headers: {
                access_token: accessToken,
                code: token,
                secret_key: CONFIG.ZALO_SECRET_KEY
            }
        });

        console.log('zalo get user profile response:', res);


        return res.data;

    }
}