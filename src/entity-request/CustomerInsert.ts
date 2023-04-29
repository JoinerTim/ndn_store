import { Property, Required } from '@tsed/schema';
import { Customer } from '../entity/Customer';
import { Gender } from "../enum";
import { Password } from "../util/password";

export class CustomerInsert {
    async toCustomer(): Promise<Customer> {
        const customer = new Customer();
        customer.email = this.email;
        customer.firstName = this.firstName;
        customer.lastName = this.lastName;
        customer.phone = this.phone;
        customer.address = this.address;

        if (this.password) {
            customer.password = await Password.hash(this.password);
        }

        customer.zaloId = this.zaloId;
        customer.facebookId = this.facebookId;
        customer.googleId = this.googleId;
        customer.appleId = this.appleId;
        customer.avatar = this.avatar;
        customer.gender = this.gender;
        customer.dob = this.dob;

        if (this.cityId) await customer.assignCity(this.cityId)

        if (this.districtId) await customer.assignDistrict(this.districtId)

        if (this.wardId) await customer.assignWard(this.wardId)

        return customer
    }

    // PROPERTIES
    @Property()
    email: string

    @Property()
    firstName: string;

    @Property()
    lastName: string;

    @Property()
    avatar: string

    @Property()
    dob: string

    @Property()
    address: string

    @Property()
    gender: Gender

    @Property()
    @Required()
    phone: string;

    @Property()
    password: string

    @Property()
    facebookId: string

    @Property()
    zaloId: string;

    @Property()
    appleId: string;

    @Property()
    googleId: string;

    @Property()
    cityId: number;

    @Property()
    districtId: number;

    @Property()
    wardId: number;


} // END FILE
