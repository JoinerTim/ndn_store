import AWS from 'aws-sdk'
import CONFIG from '../../config';
import logger from './logger'

interface SendMailParams {
    data: string,
    addressTo: string,
}

export class SES {
    static async send(subject: string, data: string, addressTo: string) {
        const sns = new AWS.SES({ apiVersion: '2021-02-22' })
        var params = {
            Destination: { /* required */
                ToAddresses: [
                    addressTo,
                ]
            },
            Message: { /* required */
                Body: { /* required */
                    Html: {
                        Charset: "UTF-8",
                        Data: data
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: "TEXT_FORMAT_BODY"
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject
                }
            },
            Source: CONFIG.MAIL_SENDER, /* required */
        };

        const res = await sns.sendEmail(params).promise()
        console.log('Result send email:', res)
        logger('error').error(`Error aws SNS: ${JSON.stringify(res)}`)

        return res
    }
}