import { Property } from "@tsed/schema";

import { Staff } from '../entity/Staff';

export class StaffUpdate {
    toStaff(): Staff {
        const staff = new Staff()
        staff.name = this.name
        staff.avatar = this.avatar
        staff.phone = this.phone
        staff.email = this.email
        staff.isBlocked = this.isBlocked
        staff.companyName = this.companyName
        return staff
    }

    // PROPERTIES

    @Property()
    name: string;

    @Property()
    avatar: string;

    @Property()
    phone: string;

    @Property()
    email: string;

    @Property()
    isBlocked: boolean;

    @Property()
    companyName: string;

} // END FILE
