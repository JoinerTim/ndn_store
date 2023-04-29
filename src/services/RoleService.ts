import { Service } from "@tsed/common";

import { CoreService } from "../core/services/CoreService";
import { Role } from "../entity/Role";
import { Permission } from "../entity/Permission";
import { PermissionImport } from "../entity-request/PermissionImport";
import { Store } from "../entity/Store";

const ROLE_ADMIN = 1

@Service()
export class RoleService extends CoreService {

    async resetRoleForAdmin(permissions: Permission[], storeId?: number) {
        let where = `role.isDeleted = false AND role.isAdmin = true`

        if (storeId) {
            where += ` AND store.id = :storeId`
        }

        const adminRole = await Role.createQueryBuilder('role')
            .leftJoinAndSelect('role.store', 'store')
            .where(where, { storeId })
            .getOne()
        adminRole.permissions = permissions
        await adminRole.save()
    }

    // =====================INIT=====================
    async initRole(name: string, description: string, store?: Store, permissions?: Permission[], isAdmin?: boolean) {
        const role = new Role()
        role.name = name
        role.description = description

        if (isAdmin) {
            role.isAdmin = true
        }

        if (permissions && permissions.length) {
            role.permissions = permissions
        } else {
            role.permissions = []
        }

        if (store) {
            role.store = store
        }

        await role.save()

        return role
    }

} // END FILE
