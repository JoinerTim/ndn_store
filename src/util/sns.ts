import AWS from 'aws-sdk'
import logger from './logger'

export class SNS {
    static async send(message: string, phone: string) {
        const sns = new AWS.SNS({ apiVersion: '2021-02-22' })
        const params = {
            Message: message,
            PhoneNumber: phone,

        }

        const res = await sns.publish(params).promise()
        console.log('Result send SMS:', res)
        logger('error').error(`Error aws SNS: ${JSON.stringify(res)}`)
    }
}