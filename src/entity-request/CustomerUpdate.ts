// IMPORT LIBRARY
import { Property } from "@tsed/schema";

// IMPORT CUSTOM
import { Customer } from "../entity/Customer";

export class CustomerUpdate {

    // Transform to draw entity
    toCustomer(): Customer {
        const customer = new Customer()
        customer.email = this.email
        customer.address = this.address
        customer.firstName = this.firstName
        customer.lastName = this.lastName
        customer.avatar = this.avatar
        customer.fullName = this.fullName

        return customer
    }

    // PROPERTIES

    @Property()
    firstName: string;

    @Property()
    fullName: string;

    @Property()
    dob: string;//format: Y-m-d

    @Property()
    lastName: string;

    @Property()
    avatar: string;

    @Property()
    address: string

    @Property()
    password: string

    @Property()
    email: string

} // END FILE
