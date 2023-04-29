import { Column, BaseEntity, ObjectType, ObjectID, FindOneOptions, FindConditions, Repository, Connection, PrimaryGeneratedColumn, SaveOptions, TreeRepository } from "typeorm";
import { BadRequest } from "@tsed/exceptions";

import { getCurrentTimeInt } from "../../util/helper"
import moment from "moment";
import { Property } from "@tsed/schema";

export default class CoreEntity extends BaseEntity {
    public static connection: Connection;

    constructor() {
        super()
    }


    // PROPERTIES

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    createdAt: number;

    @Column()
    updatedAt: number;

    @Column({ default: false })
    isDeleted: boolean;

    @Column({ default: 0 })
    deletedAt: number;

    // METHODS

    static getRepository<T extends BaseEntity>(this: ObjectType<T>): Repository<T> {
        const connection: Connection = (this as any).usedConnection || (this as any).connection;
        return connection.getRepository<T>(this);
    }

    static getTreeRepository<T extends BaseEntity>(this: ObjectType<T>): TreeRepository<T> {
        const connection: Connection = (this as any).usedConnection || (this as any).connection;
        return connection.getTreeRepository<T>(this);
    }


    save(): Promise<this> {
        if (!this.hasId()) {
            this.createdAt = getCurrentTimeInt()
        }
        this.updatedAt = getCurrentTimeInt()
        return super.save()
    }

    delete(): Promise<this> {
        this.deletedAt = getCurrentTimeInt()
        this.isDeleted = true;
        return super.save()
    }

    static async save<T extends CoreEntity>(this: ObjectType<T>, entities: T[], options?: SaveOptions): Promise<T[]> {
        for (const item of entities) {
            if (!item.hasId()) {
                item.createdAt = moment().unix();
            }
            item.updatedAt = moment().unix();
        }
        await super.save(entities);
        return entities;
    }


    static async findOneOrThrowId<T extends BaseEntity>(
        this: ObjectType<T>, id?: string | number | Date | ObjectID,
        options?: FindOneOptions<T>,
        replaceName?: string
    ): Promise<T> {
        try {
            return await super.findOneOrFail<T>(id, options)
        } catch (error) {
            console.log(error);
            throw new BadRequest(`${replaceName ? replaceName : this.name} không tồn tại.`)
        }
    }


    static async findOneOrThrowOption<T extends BaseEntity>(
        this: ObjectType<T>,
        options?: FindOneOptions<T>,
        replaceName?: string
    ): Promise<T> {
        try {
            return await super.findOneOrFail<T>(options)
        } catch (error) {
            console.log(error);
            throw new BadRequest(`${replaceName ? replaceName : this.name} không tồn tại.`)
        }
    }

} // END FILE
