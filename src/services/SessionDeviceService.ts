// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { SessionDevice } from "../entity/SessionDevice";

interface SessionDeviceQuery {
    page: number;
    limit: number
    search?: string
    storeId?: number
    staffId?: number
    employeeId?: number
}

@Service()
export class SessionDeviceService {

    async create({
        deviceId,
        deviceName,
        ipAddress,
        staff,
        store,
        employee
    }: Partial<SessionDevice>) {
        let sessionDevice = await SessionDevice.findOne({
            where: {
                deviceId,
                staff,
                store
            }
        })

        if (!sessionDevice) {
            sessionDevice = new SessionDevice();
        }

        sessionDevice.deviceId = deviceId
        sessionDevice.deviceName = deviceName
        sessionDevice.ipAddress = ipAddress
        sessionDevice.staff = staff
        sessionDevice.store = store
        sessionDevice.employee = employee

        await sessionDevice.save();
        return sessionDevice
    }


    async getManyAndCount({
        page,
        limit,
        search = '',
        staffId,
        storeId,
        employeeId
    }: SessionDeviceQuery) {
        let where = `sessionDevice.isDeleted = false`;

        if (staffId) {
            where += ` AND staff.id = :staffId`
        }

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        if (employeeId) {
            where += ` AND employee.id = :employeeId`
        }

        const [sessionDevices, total] = await SessionDevice.createQueryBuilder('sessionDevice')
            .leftJoinAndSelect('sessionDevice.store', 'store')
            .leftJoinAndSelect('sessionDevice.staff', 'staff')
            .leftJoinAndSelect('sessionDevice.employee', 'employee')
            .where(where, { search: `%${search}%`, storeId, staffId, employeeId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('sessionDevice.id', 'DESC')
            .getManyAndCount()

        return { sessionDevices, total }
    }

} //END FILE
