// IMPORT LIBRARY
import { Property } from "@tsed/schema";

// IMPORT CUSTOM
import { Employee } from '../entity/Employee';
import { Password } from "../util/password";

export class EmployeeInsert {
    // Transform to draw entity
    async toEmployee() {
        const employee = new Employee();
        employee.name = this.name;
        employee.phone = this.phone;
        employee.password = await Password.hash(this.password);
        employee.username = this.username

        return employee
    }

    // PROPERTIES
    @Property()
    name: string;

    @Property()
    phone: string;

    @Property()
    username: string;

    @Property()
    password: string;

} // END FILE
