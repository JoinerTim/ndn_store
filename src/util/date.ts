import moment from "moment"

export const getCurrentDateTime = () => {
    return moment().format('YYYY-MM-DD HH:mm:ss')
}