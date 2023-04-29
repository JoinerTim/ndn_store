import { Property } from "@tsed/schema";
import { Permission } from "../entity/Permission";

export class PermissionImport {

    toPermission() {
        const permission = new Permission()
        permission.id = this.id;
        permission.path = this.path;
        permission.name = this.name;
        permission.title = this.title;

        return permission
    }

    // PROPERTIES

    @Property()
    id: number

    @Property()
    path: string;

    @Property()
    name: string;

    @Property()
    title: string;

}
