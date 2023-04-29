// IMPORT LIBRARY
import { Service } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";


// IMPORT CUSTOM
import { Employee } from "../entity/Employee";
import { Password } from "../util/password";

interface EmployeeQuery {
    page: number;
    limit: number
    search?: string
    storeId?: number
}

@Service()
export class EmployeeService {

    async getManyAndCount({
        page,
        limit,
        search = '',
        storeId
    }: EmployeeQuery) {
        let where = `employee.name LIKE :search AND employee.isDeleted = false`;

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const [employees, total] = await Employee.createQueryBuilder('employee')
            .leftJoinAndSelect('employee.store', 'store')
            .leftJoinAndSelect('employee.role', 'role')
            .where(where, { search: `%${search}%`, storeId })
            .skip((page - 1) * limit)
            .take(limit)
            .orderBy('employee.id', 'DESC')
            .getManyAndCount()

        return { employees, total }
    }

    async updatePassword(employeeId: number, oldPass: string, newPass: string) {
        const employee = await Employee.findOne({
            select: ['password', 'id'],
            where: {
                id: employeeId
            }
        });

        const isValid = Password.validate(oldPass, employee.password);
        if (!isValid) {
            throw new BadRequest("Mật khẩu cũ không đúng");
        }

        employee.password = await Password.hash(newPass);
        await employee.save()

    }

    async validate(employee: Employee, storeId: number, employeeId: number = null) {
        const {
            username
        } = employee;

        let where = 'employee.isDeleted = 0 AND store.id = :storeId AND employee.username = :username'

        if (employeeId) {
            where += ` AND employee.id != :employeeId`
        }

        const existEmployee = await Employee.createQueryBuilder('employee')
            .leftJoin('employee.store', 'store')
            .where(where, { employeeId, storeId, username })
            .getOne();

        if (existEmployee) {
            let msg = '';

            if (existEmployee.username == username) {
                msg = 'Username'
            }

            if (msg) {
                throw new BadRequest(`${msg} đã được đăng ký`);
            }
        }
    }

} //END FILE
