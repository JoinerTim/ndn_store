import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany, OneToOne, JoinTable, JoinColumn, Index } from "typeorm";

import { addPrefix, leftPad } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Property } from "@tsed/schema";
import { Staff } from "./Staff";
import { Depot } from "./Depot";
import { Area } from "./Area";
import { Order } from "./Order";
import { City } from "./City";
import { District } from "./District";
import { Ward } from "./Ward";
import { Conversation } from "./Conversation";
import { PromotionCampaign } from "./PromotionCampaign";
import { Product } from "./Product";
import { FlashSaleCampaign } from "./FlashSaleCampaign";
import { CouponCampaign } from "./CouponCampaign";
import { LikedProduct } from "./LikedProduct";
import { ViewedProduct } from "./ViewedProduct";
import { Customer } from "./Customer";
import { Branch } from "./Branch";
import { UserType } from "../types/user";
import { Employee } from "./Employee";
import { ProductCategory } from "./ProductCategory";
import { CustomField } from "./CustomField";
import { STORE_CODE } from "../enum";
import { Banner } from "./Banner";
import { StoreContentDefine } from "./StoreContentDefine";
import { OnlinePayment } from "./OnlinePayment";
import { CustomerRank } from "./CustomerRank";
import { ProductTag } from "./ProductTag";
import { NewsTag } from "./NewsTag";
import { Configuration } from "./Configuration";
import { Role } from "./Role";
import { Permission } from "./Permission";
import { UpgradeRankHistory } from "./UpgradeRankHistory";
import { BenefitPackage } from "./BenefitPackage";
import { Popup } from "./Popup";
import { Inventory } from "./Inventory";
import { GroupCustomer } from "./GroupCustomer";
import { Transport } from "./Transport";
import { QuickMessage } from "./QuickMessage";

export enum StoreType {
    Store = 'STORE', //Cửa hàng
    Factory = 'FACTORY', //nhà máy
}

@Entity(addPrefix("store"))
export class Store extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    code: string;

    @Column({ default: '' })
    @Index({})
    namespace: string; //namespace 

    @Column({ default: '' })
    @Property()
    name: string;

    @Column({ default: '' })
    @Property()
    phone: string;

    @Column({ default: UserType.Admin, type: 'enum', enum: UserType })
    createdBy: UserType;

    @Column({ default: StoreType.Store, type: 'enum', enum: StoreType })
    type: StoreType;

    @Column({ default: '' })
    @Property()
    avatar: string; //hình ảnh chính của cửa hàng

    @Column({ default: '' })
    @Property()
    address: string;

    @Column({ default: 0, type: 'double' })
    @Property()
    lat: number;

    @Column({ default: 0, type: 'double' })
    @Property()
    lng: number;

    //dynamic configuration
    @Column({ default: '' })
    @Property()
    primaryColor: string; //màu chủ đạo

    @Column({ default: '' })
    @Property()
    appPackageName: string;

    @Column({ default: '' })
    @Property()
    appName: string;

    @Column({ default: '' })
    @Property()
    facebookAppId: string;

    @Column({ default: '' })
    @Property()
    googleAppId: string;

    @Column({ default: '' })
    @Property()
    schemaApp: string;

    @Column({ default: '' })
    @Property()
    loginImageBackground: string; // hình ảnh nền màn hình login trên mobile

    @Column({ default: '' })
    @Property()
    splashImage: string; //hình ảnh khởi động app
    //end - dynamic configuration


    // RELATIONS
    @OneToMany(() => Staff, staff => staff.store)
    staffs: Staff[];

    @OneToMany(() => Depot, depot => depot.store)
    depots: Depot[];

    @OneToMany(() => Inventory, inventory => inventory.store)
    inventories: Inventory[];

    @ManyToOne(() => Area, area => area.stores)
    area: Area;

    @ManyToOne(() => City)
    city: City;

    @ManyToOne(() => District)
    district: District;

    @ManyToOne(() => Ward)
    ward: Ward;

    @ManyToOne(() => BenefitPackage, (benefitPackage) => benefitPackage.stores)
    benefitPackage: BenefitPackage;

    @OneToMany(() => Transport, transport => transport.store)
    transports: Transport[];

    @OneToMany(() => Conversation, conversation => conversation.store)
    conversations: Conversation[];

    @OneToMany(() => Order, order => order.store)
    orders: Order[];

    @OneToMany(() => PromotionCampaign, promotionCampaign => promotionCampaign.store)
    promotionCampaigns: PromotionCampaign[];

    @OneToMany(() => FlashSaleCampaign, flashSaleCampaign => flashSaleCampaign.store)
    flashSaleCampaigns: FlashSaleCampaign[];

    @OneToMany(() => CouponCampaign, couponCampaign => couponCampaign.store)
    couponCampaigns: CouponCampaign[];

    @OneToMany(() => Configuration, configuration => configuration.store)
    configurations: Configuration[];

    @OneToMany(() => LikedProduct, likeProduct => likeProduct.store)
    likeProducts: LikedProduct[];

    @OneToMany(() => ViewedProduct, viewedProduct => viewedProduct.store)
    viewedProducts: ViewedProduct[];

    @OneToMany(() => Branch, branch => branch.store)
    branches: Branch[];

    @OneToMany(() => Employee, employee => employee.store)
    employees: Employee[];

    @OneToMany(() => ProductCategory, productCategory => productCategory.store)
    productCategories: ProductCategory[];

    @OneToMany(() => Product, product => product)
    products: Product[];

    @OneToMany(() => CustomField, customField => customField)
    customFields: CustomField[];

    @OneToMany(() => Customer, customer => customer.store)
    customers: Customer[];

    @OneToMany(() => Role, role => role.store)
    roles: Role[];

    @OneToMany(() => Popup, popup => popup.store)
    popups: Popup;

    @OneToMany(() => QuickMessage, quickMessage => quickMessage.store)
    quickMessages: QuickMessage[];

    @ManyToOne(() => Staff)
    deletedBy: Staff;

    @OneToMany(() => Banner, banner => banner.store)
    banners: Banner[];

    @OneToMany(() => StoreContentDefine, storeContentDefine => storeContentDefine.store)
    storeContentDefines: StoreContentDefine[];

    @OneToMany(() => OnlinePayment, onlinePayment => onlinePayment.store)
    onlinePayments: OnlinePayment[];

    @OneToMany(() => CustomerRank, customerRank => customerRank.store)
    customerRanks: CustomerRank[];

    @OneToMany(() => ProductTag, productTag => productTag.store)
    productTags: ProductTag[];

    @OneToMany(() => NewsTag, newsTag => newsTag.store)
    newsTags: NewsTag[];

    @OneToMany(() => UpgradeRankHistory, upgradeRankHistory => upgradeRankHistory.store)
    upgradeRankHistories: UpgradeRankHistory[];

    @OneToMany(() => GroupCustomer, groupCustomer => groupCustomer.store)
    groupCustomers: GroupCustomer[];

    // METHODS
    async generateCode() {
        const count = await Store.count()

        this.code = `${STORE_CODE}-${leftPad(count + 1, 3)}`
    }

    public async assignArea(areaId: number) {
        const area = await Area.findOneOrThrowId(areaId, null, '')
        this.area = area
    }

    public async assignCity(cityId: number) {
        const city = await City.findOneOrThrowId(cityId, null, '')
        this.city = city
    }

    public async assignDistrict(districtId: number) {
        const district = await District.findOneOrThrowId(districtId, null, '')
        this.district = district
    }

    public async assignWard(wardId: number) {
        const ward = await Ward.findOneOrThrowId(wardId, null, '')
        this.ward = ward
    }

    public async assignBenefitPackage(benefitPackageId: number) {
        if (!benefitPackageId) {
            const benefitPackage = await BenefitPackage.findOneOrThrowOption({ where: { isDefault: true } })
            this.benefitPackage = benefitPackage
        } else {
            const benefitPackage = await BenefitPackage.findOneOrThrowId(benefitPackageId, null, '')
            this.benefitPackage = benefitPackage
        }
    }


} // END FILE
