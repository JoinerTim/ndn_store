import { Service } from "@tsed/common";

import { CoreService } from "../core/services/CoreService";
import { Staff } from "../entity/Staff";
import { Permission } from "../entity/Permission";
import { Password } from "../util/password";
import { Role } from "../entity/Role";
import { BadRequest } from "@tsed/exceptions";

interface ChangePasswordParams {
    staff: Staff
    oldPassword: string
    newPassword: string
}

@Service()
export class StaffService extends CoreService {

    // =====================LOGIN=====================
    public async login(username: string, password: string): Promise<Staff> {
        const staff = await Staff.findOneOrThrowOption({ where: { username, isDeleted: false } })

        await this.validatePassword(staff, password)

        if (staff.isBlocked) {
            throw new BadRequest('Tài khoản đã bị khóa')
        }

        return staff
    }


    // =====================GET PERMISSION=====================
    public async getPermission(staffId: number): Promise<Permission[]> {
        return Permission.createQueryBuilder("p")
            .leftJoin("p.roles", "r")
            .leftJoin("r.staff", "a")
            .where("a.id = :staffId", { staffId })
            .getMany()
    }


    // =====================CHECK DUPLICATE=====================
    async checkDuplicate(staff: Staff, userId: number = null) {
        const { username, phone, email } = staff

        const oldStaff = await Staff.findOne({
            where: [{ username, isDeleted: false }, { phone, isDeleted: false }, { email, isDeleted: false }]
        })

        if (oldStaff && oldStaff.id != userId) {
            let message = ""

            if (oldStaff.username == staff.username) {
                message = "Username"
            } else if (oldStaff.phone == staff.phone) {
                message = "Phone number"
            } else if (oldStaff.email == staff.email) {
                message = "Email"
            }

            if (message) {
                throw new BadRequest(`${message} đã tồn tại.`)
            }

        }
    }


    // =====================INIT=====================
    async initStaff(role: Role, name: string, username: string, password: string) {
        const staff = new Staff()
        staff.role = role
        staff.name = name
        staff.username = username
        staff.password = await Password.hash(password)
        await staff.save()
    }


    // =====================CHANGE PASSWORD=====================
    async changePassword({ staff, oldPassword, newPassword }: ChangePasswordParams) {
        await this.validatePassword(staff, oldPassword)

        if (oldPassword == newPassword) {
            throw new BadRequest('Mật khẩu mới không cho phép giống với mật khẩu cũ');
        }

        staff.password = await Password.hash(newPassword)
        await staff.save()
    }


    public async validatePassword(staff: Staff, password: string) {
        const staffWithPass = await Staff.findOneOrThrowOption({
            select: ["password", "id"],
            where: { id: staff.id }
        })

        const isValid = await Password.validate(password, staffWithPass.password)
        if (!isValid) {
            throw new BadRequest('Mật khẩu không đúng!')
        }

    }

} // END FILE
