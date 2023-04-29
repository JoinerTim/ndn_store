// IMPORT LIBRARY
import { Property } from "@tsed/schema";

// IMPORT CUSTOM
import { Employee } from '../entity/Employee';
import { Password } from "../util/password";

export class EmployeeUpdate {
    // Transform to draw entity
    async toEmployee() {
        const employee = new Employee();
        employee.name = this.name;
        employee.phone = this.phone;

        return employee
    }

    // PROPERTIES
    @Property()
    name: string;

    @Property()
    phone: string;
} // END FILE
