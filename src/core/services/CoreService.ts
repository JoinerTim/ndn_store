import { Service, AfterRoutesInit } from "@tsed/common";
import { TypeORMService } from "@tsed/typeorm";
import { Connection, EntityManager } from "typeorm";
import CONFIG from "../../../config";
import CoreEntity from "../entity/CoreEntity";

@Service()
export class CoreService implements AfterRoutesInit {
    public connection: Connection;
    public manager: EntityManager

    constructor(
        public typeORMService: TypeORMService,
    ) { }

    $afterRoutesInit() {
        //default
        this.connection = <any>this.typeORMService.get()
        console.log('this.connection name:', this.connection.name)
        this.manager = this.connection.manager
        CoreEntity.connection = this.connection
    }

} // END FILE
