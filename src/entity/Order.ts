import { Entity, Column, OneToMany, ManyToOne, OneToOne, ManyToMany, JoinTable } from "typeorm";
import { Property } from "@tsed/schema";

import { addPrefix, formatVND, getCurrentTimeInt, leftPad } from "../util/helper"
import CoreEntity from '../core/entity/CoreEntity';
import { Customer } from "./Customer";
import { OrderDetail } from "./OrderDetail";
import { EPaymentType } from "../enum";
import { ProductRate } from "./ProductRate";
import { Product } from "./Product";
import { OrderLog } from "./OrderLog";
import { OrderStatus, EDeliveryType, OrderCancelBy, PaymentStatus, DeliveryStatus } from "../types/order";
import { OrderReceipt } from "./OrderReceipt";
import { City } from "./City";
import { District } from "./District";
import { Ward } from "./Ward";
import { OnlinePayment } from "./OnlinePayment";
import { Depot } from "./Depot";
import { Inventory } from "./Inventory";
import { Store } from "./Store";
import { CouponCampaign, CouponDiscountType } from "./CouponCampaign";
import moment from "moment";
import { PromotionCampaign, PromotionDiscountType } from "./PromotionCampaign";
import { CustomerCoupon } from "./CustomerCoupon";
import { BadRequest } from "@tsed/exceptions";
import { ShipFee } from "./ShipFee";
import { PromotionCampaignDetail } from "./PromotionCampaignDetail";
import { Configuration, ConfigurationParam } from "./Configuration";
import { Staff } from "./Staff";
import { ProductTax } from "./ProductTax";
import { ProductCategory } from "./ProductCategory";
import { OrderProductTax } from "./OrderProductTax";

interface CustomerRef {
    id: number,
    totalPoints: number,
    productRefs: Number[]
}

@Entity(addPrefix("order"))
export class Order extends CoreEntity {
    constructor() {
        super()
    }

    // PROPERTIES
    @Column({ default: '' })
    code: string;

    @Column({ default: true })
    @Property()
    isHasPoint: boolean;

    @Column({ nullable: true, type: 'text' })
    @Property()
    note: string; //

    @Column({ default: 0, type: 'double' })
    @Property()
    length: number; //thông số dành cho đơn ship

    @Column({ default: 0, type: 'double' })
    @Property()
    width: number; //thông số dành cho đơn ship

    @Column({ default: 0, type: 'double' })
    @Property()
    height: number; //thông số dành cho đơn ship

    @Column({ default: EPaymentType.Balance, type: 'enum', enum: EPaymentType })
    @Property()
    paymentMethod: EPaymentType;

    @Column({ default: EDeliveryType.Manual, type: 'enum', enum: EDeliveryType })
    @Property()
    deliveryType: EDeliveryType;

    @Column({ default: '' })
    @Property()
    senderName: string;

    @Column({ default: '' })
    @Property()
    senderPhone: string;

    @Column({ default: '' })
    @Property()
    senderAddress: string;

    @Column({ nullable: false })
    @Property()
    receiverName: string;

    @Column({ nullable: false })
    @Property()
    receiverPhone: string;

    @Column({ nullable: false })
    @Property()
    receiverAddress: string;

    @Column({ default: OrderStatus.Pending, type: 'enum', enum: OrderStatus })
    @Property()
    status: OrderStatus;

    @Column({ default: PaymentStatus.Pending, type: 'enum', enum: PaymentStatus })
    paymentStatus: PaymentStatus;

    @Column({ default: 0, type: 'double' })
    @Property()
    subTotalMoney: number; //tạm tính

    @Column({ default: 0, type: 'double' })
    @Property()
    moneyProductOrigin: number; //tiền sp chưa bao gồm khuyến mãi

    @Column({ default: 0, type: 'double' })
    @Property()
    moneyProduct: number;

    @Column({ default: 0, type: 'double' })
    @Property()
    moneyVat: number;

    @Column({ default: 0, type: 'double' })
    @Property()
    moneyTax: number;

    @Column({ default: 0, type: 'double' })
    @Property()
    vatPercent: number;

    @Column({ default: 0, type: 'double' })
    @Property()
    shipFee: number; //phí v/c

    @Column({ default: 0, type: 'double' })
    @Property()
    distance: number;//dvt: km

    @Column({ default: 0, type: 'double' })
    @Property()
    moneyFinal: number; //Tiền khách cần trả

    @Column({ default: 0, type: 'double' })
    @Property()
    totalWeight: number; //tổng cân nặng (dvt: gram)

    @Column({ default: 0, type: 'double' })
    @Property()
    totalMoneyDiscount: number; //giảm giá tiền hàng cho promotion

    @Column({ default: 0, type: 'double' })
    @Property()
    moneyDiscount: number; //giảm giá tiền hàng cho promotion

    @Column({ default: 0, type: 'double' })
    @Property()
    moneyDiscountCoupon: number;//giảm giá tiền hàng cho promotion

    @Column({ default: 0, type: 'double' })
    @Property()
    moneyDiscountShipFee: number;//giảm trừ phí ship

    @Column({ default: 0, type: 'double' })
    @Property()
    moneyDiscountFlashSale: number;//tổng tiền giảm từ flash sale

    @Column({ default: 0, type: 'double' })
    totalPoints: number;//điểm nhận đc khi hoàn thành đơn hàng

    @Column({ default: 0, type: 'double' })
    totalRefPoints: number;//điểm hoa hồng nhận đc khi người được chia sẻ hoàn thành đơn hàng

    @Column({ default: 0, type: 'double' })
    @Property()
    pointRate: number;

    @Column({ default: false })
    isRated: boolean; //đơn đã đánh giá

    @Column({ default: 0 })
    rewardPoints: number; //số điểm nhận khi đánh giá đơn

    @Column({ default: 0 })
    @Property()
    estimatedDeliveryAt: number; //thời gian dự kiến giao hàng

    @Column({ default: false })
    @Property()
    isReceiveAtStore: boolean; //true: nhận hàng tại cửa hàng, phí ship = 0

    @Column({ nullable: true, type: 'enum', enum: OrderCancelBy })
    cancelBy: OrderCancelBy;

    @Column({ default: DeliveryStatus.Pending, type: 'enum', enum: DeliveryStatus })
    deliveryStatus: DeliveryStatus;

    //custom
    isExpiredCoupon: boolean // true: hết hạn coupon
    couponMsg: string//tồn tại length thì lỗi

    // RELATIONS
    @ManyToOne(() => Customer, customer => customer.orders)
    customer: Customer;

    @ManyToOne(() => OnlinePayment, onlinePayment => onlinePayment.orders)
    onlinePayment: OnlinePayment;

    @OneToMany(() => OrderDetail, orderDetail => orderDetail.order)
    details: OrderDetail[];

    @OneToMany(() => OrderDetail, gift => gift.orderGift)
    gifts: OrderDetail[];

    @OneToMany(() => OrderProductTax, orderProductTax => orderProductTax.order)
    orderProductTaxs: OrderProductTax[];

    @OneToMany(() => ProductRate, productRate => productRate.order)
    productRates: ProductRate[];

    @OneToMany(() => OrderLog, orderLog => orderLog.order)
    orderLogs: OrderLog[];

    @OneToOne(() => OrderReceipt, orderReceipt => orderReceipt.order)
    orderReceipt: OrderReceipt; //thông tin nhận hóa đơn

    @ManyToOne(() => City)
    receiverCity: City;

    @ManyToOne(() => District)
    receiverDistrict: District;

    @ManyToOne(() => Ward)
    receiverWard: Ward;

    @ManyToOne(() => City)
    senderCity: City;

    @ManyToOne(() => District)
    senderDistrict: District;

    @ManyToOne(() => Ward)
    senderWard: Ward;

    @ManyToOne(() => Depot, depot => depot)
    depot: Depot;

    @OneToMany(() => Inventory, inventory => inventory.order)
    inventories: Inventory[];

    @ManyToOne(() => Store, store => store.orders, {
        eager: true
    })
    store: Store;

    @ManyToOne(() => CouponCampaign, couponCampaign => couponCampaign.orders)
    couponCampaign: CouponCampaign; //coupon đc apply

    @ManyToMany(() => PromotionCampaign, promotionCampaign => promotionCampaign.orders)
    @JoinTable()
    promotionCampaigns: PromotionCampaign[]; //

    @ManyToOne(() => CustomerCoupon, customerCoupon => customerCoupon.orders)
    customerCoupon: CustomerCoupon;

    @ManyToOne(() => Staff)
    canceledStaff: Staff;

    @ManyToOne(() => Customer)
    canceledCustomer: Customer;

    @OneToOne(() => CustomerCoupon, customerCoupon => customerCoupon.giftedOrder)
    giftedCustomerCoupon: CustomerCoupon;

    @ManyToOne(() => Customer)
    refCustomer: Customer;

    // METHOD

    public async assignRefCustomer(refCustomerId: number) {
        const refCustomer = await Customer.findOneOrThrowId(refCustomerId, null, '')
        this.refCustomer = refCustomer
    }

    public async assignStore(storeId: number) {
        const store = await Store.findOneOrThrowId(storeId, null, '')
        this.store = store
    }

    public async assignPromotionCampaigns(promotionCampaignIds: number[] = []) {
        const promotionCampaigns = await PromotionCampaign.findByIds(promotionCampaignIds, {
            relations: ['store', 'promotionCampaignDetails', 'promotionCampaignDetails.product']
        });
        this.promotionCampaigns = promotionCampaigns
    }

    public async assignCustomerCoupon(customerCouponId: number) {
        const customerCoupon = await CustomerCoupon.findOneOrThrowId(customerCouponId, null, '')
        this.customerCoupon = customerCoupon

        const current = getCurrentTimeInt()
        if (customerCoupon.expiredAt < current) {
            this.isExpiredCoupon = true;
            this.couponMsg = 'Mã coupon đã hết hạn.'
        }

        if (customerCoupon.isUsed) {
            this.couponMsg = 'Mã coupon đã sử dùng được rồi.'
        }
    }

    public async assignCustomerCouponCode(customerCouponCode: string) {
        const customerCoupon = await CustomerCoupon.findOneOrThrowOption({
            where: {
                code: customerCouponCode
            },
            relations: ['couponCampaign']
        })
        this.customerCoupon = customerCoupon

        const current = getCurrentTimeInt()
        if (customerCoupon.couponCampaign.endAt < current) {
            this.isExpiredCoupon = true;
            this.couponMsg = 'Mã coupon đã hết hạn.'
            throw new BadRequest('Mã coupon đã hết hạn.')
        }

        if (customerCoupon.isUsed) {
            this.couponMsg = 'Mã coupon đã sử dùng được rồi.'
            throw new BadRequest('Mã coupon đã sử dùng được rồi.')

        }
    }


    public async assignOnlinePayment(onlinePaymentId: number) {
        const onlinePayment = await OnlinePayment.findOneOrThrowId(onlinePaymentId, null, '')
        this.onlinePayment = onlinePayment
    }

    async generateCode() {
        const totalOrder = await Order.count()
        this.code = `DH` + leftPad(totalOrder + 1, 6)
    }

    async calcShipFee() {
        // //tắt tạm để work, do chưa có cấu hình
        // return 0


        //nhận hàng tại cửa hàng
        if (this.isReceiveAtStore) {
            return 0;
        }


        if (this.deliveryType == EDeliveryType.Factory) {
            const shipFeeConfig = await Configuration.findOne({
                where: {
                    param: ConfigurationParam.ShipFeeFromStore
                }
            });

            return +shipFeeConfig?.value || 30000;
        }

        let shipFee: ShipFee

        //tìm quận huyện
        shipFee = await ShipFee.findOne({
            where: {
                city: this.receiverCity,
                district: this.receiverDistrict,
                store: this.store
            }
        })

        if (shipFee) {
            return shipFee.price;
        }

        //tìm theo city
        shipFee = await ShipFee.findOne({
            where: {
                city: this.receiverCity,
                store: this.store
            }
        })

        if (shipFee) {
            return shipFee.price;
        }

        return shipFee?.price || 30000;
    }

    isExistRefId(customerRefs: CustomerRef[], id: number) {
        const refIds = customerRefs.map((item) => item.id)
        return refIds.includes(id)
    }

    async calcMoney() {
        this.shipFee = await this.calcShipFee();
        this.estimatedDeliveryAt = moment().add(2, 'days').unix()
        this.subTotalMoney = 0;
        this.moneyFinal = 0;
        this.vatPercent = 10;
        this.moneyVat = 0;
        this.moneyTax = 0;
        this.totalPoints = 0;
        this.totalRefPoints = 0;
        this.moneyDiscount = 0;
        this.moneyDiscountCoupon = 0;
        this.moneyDiscountShipFee = 0;
        this.totalMoneyDiscount = 0
        this.moneyProduct = 0;//tiền hàng
        this.moneyProductOrigin = this.details.reduce((prev, cur) => prev + (cur.price * cur.quantity), 0);
        this.moneyDiscountFlashSale = this.details.reduce((prev, cur) => prev + (cur.discountFlashSale * cur.quantity), 0)

        for (const detail of this.details) {
            this.moneyProduct += (detail.quantity * (detail.finalPrice));
        }

        //handle promotion
        const current = getCurrentTimeInt()

        //validate promotion
        if (this.promotionCampaigns) {
            for (const promotionCampaign of this.promotionCampaigns) {
                if (promotionCampaign.endAt < current) {
                    throw new BadRequest(`Khuyến mãi '${promotionCampaign.name}' đã quá hạn`);
                }

                if (this.store.id != promotionCampaign.store.id) {
                    throw new BadRequest(`Khuyến mãi '${promotionCampaign.name}' không dành cho cửa hàng này.`);
                }
            }
        }
        //end - validate promotion

        //promotion gift
        let gifts: OrderDetail[] = []

        //tặng kèm trên từng sp
        for (const detail of this.details) {
            if (detail.giftPromotionCampaignDetail && detail.giftPromotionCampaignDetail.promotionCampaign) {
                if (detail.giftPromotionCampaignDetail.promotionCampaign.endAt < current) {
                    detail.isExpiredPromotion = true; //UI tự handle
                }

                const promotionCampaign = await PromotionCampaign.findOneOrThrowId(detail.giftPromotionCampaignDetail.promotionCampaign.id, {
                    relations: ['promotionCampaignDetails', 'promotionCampaignDetails.product']
                }, '');

                //promotion tặng quà
                const giftDetails = promotionCampaign.promotionCampaignDetails.filter(e => e.isGift)
                gifts = [...gifts, ... this.generateGiftFromPromotionDetails(giftDetails, detail)]
            }
        }

        //áp dụng khuyến mãi
        if (this.promotionCampaigns) {
            //tặng kèm trên đơn
            const giftPromotions = this.promotionCampaigns.filter(e => e.discountType == PromotionDiscountType.Gift)

            //limit 1 đơn 1 k.mãi
            if (giftPromotions.length > 1) {
                throw new BadRequest("Khuyến mãi quà tặng trên đơn không hợp lệ.");
            }

            for (const promotionCampaign of giftPromotions) {
                gifts = [...gifts, ...this.generateGiftFromPromotionDetails(promotionCampaign.promotionCampaignDetails)]
            }
            //end - tặng kèm trên đơn

            //giảm phí ship
            const shipFeePromotions = this.promotionCampaigns.filter(e => e.discountType == PromotionDiscountType.ShipFee);
            //limit 1 đơn 1 k.mãi
            if (shipFeePromotions.length > 1) {
                throw new BadRequest("Khuyến mãi quà tặng trên đơn không hợp lệ.");
            }

            for (const promotionCampaign of shipFeePromotions) {
                if (promotionCampaign.conditionValue && this.moneyProduct < promotionCampaign.conditionValue) {
                    throw new BadRequest("Giá trị đơn hàng không đủ để áp dụng giảm phí vận chuyển");
                }

                this.moneyDiscountShipFee = this.shipFee;
            }
            //end - giảm phí ship

            //giảm tiền trực tiếp
            const fixedPromotions = this.promotionCampaigns.filter(e => e.discountType == PromotionDiscountType.Fixed);
            if (fixedPromotions.length > 1) {
                throw new BadRequest("Khuyến mãi trên đơn không hợp lệ.");
            }

            for (const fixedPromotion of fixedPromotions) {
                if (fixedPromotion.conditionValue > this.moneyProduct) {
                    throw new BadRequest(`Giá trị đơn phải tối thiểu ${formatVND(fixedPromotion.conditionValue)} đ để được áp dụng khuyến mãi`);
                }

                this.moneyDiscount = fixedPromotion.discountValue
            }
            //end - giảm tiền trực tiếp

        }
        //

        //handle coupon
        if (this.couponCampaign) {
            //tính tiền giảm coupon
            const moneyDiscountCoupon = await this.couponCampaign.calcMoney(this.details, this.moneyProduct, this)
            this.moneyDiscountCoupon += moneyDiscountCoupon
        }
        //

        if (this.customerCoupon) {
            const moneyDiscountCoupon = await this.customerCoupon.calcMoney(this.details, this.moneyProduct, this, this.customerCoupon)
            this.moneyDiscountCoupon += moneyDiscountCoupon
        }

        this.gifts = gifts;

        this.totalMoneyDiscount = this.moneyDiscount
            + this.moneyDiscountCoupon
            + this.moneyDiscountShipFee

        const productTaxs = await ProductTax.find({
            where: {
                isDeleted: false,
                store: this.store
            }
        })
        const orderProductTaxs = []
        let totalOrderTaxs = 0
        for (const item of productTaxs) {
            const orderProductTax = new OrderProductTax()
            orderProductTax.name = item.name
            orderProductTax.value = item.value
            orderProductTax.moneyTax = item.value / 100 * (this.moneyProduct - this.totalMoneyDiscount)
            totalOrderTaxs += item.value / 100 * (this.moneyProduct - this.totalMoneyDiscount)
            orderProductTaxs.push(orderProductTax)
        }
        this.orderProductTaxs = orderProductTaxs

        this.moneyVat = totalOrderTaxs
        this.moneyFinal = this.moneyProduct + this.moneyVat + this.shipFee - this.totalMoneyDiscount

        await this.calcPointRefund();

        const ratePointConfiguration = await Configuration.findOne({
            where: {
                param: ConfigurationParam.RewardPoint,
                store: this.store
            }
        })

        this.rewardPoints = +ratePointConfiguration?.value || 0
    }

    async calcPointRefund() {
        const pointRefundRate = await Configuration.findOne({
            where: {
                param: ConfigurationParam.PointRefundRate
            }
        });

        if (pointRefundRate) {
            this.pointRate = +(pointRefundRate).value || 0
            this.totalPoints = Math.round(this.moneyFinal * this.pointRate)
        }
    }

    /**
     * Tạo gift từ promotion
     */
    generateGiftFromPromotionDetails(promotionCampaignDetails: PromotionCampaignDetail[], parent?: OrderDetail) {
        const gifts: OrderDetail[] = []
        const giftDetails = promotionCampaignDetails.filter(e => e.isGift)
        for (const promotionCampaignDetail of giftDetails) {
            let rate = parent ? Math.floor(parent.quantity / parent.giftPromotionCampaignDetail.needed) : 1
            console.log('rate:', rate, 'parent:', parent, 'parent.giftPromotionCampaignDetail.needed', parent?.giftPromotionCampaignDetail?.id)
            if (rate < 1) {
                continue;
            }

            const quantity = rate * promotionCampaignDetail.quantity

            const orderDetail = new OrderDetail()
            orderDetail.price = 0;
            orderDetail.discount = promotionCampaignDetail.discount
            orderDetail.quantity = quantity;
            orderDetail.product = promotionCampaignDetail.product
            orderDetail.isGift = true;
            orderDetail.parent = parent;
            orderDetail.giftPromotionCampaignDetail = promotionCampaignDetail
            gifts.push(orderDetail)
        }
        return gifts
    }

    public async assignCustomer(customerId: number) {
        const customer = await Customer.findOneOrThrowId(customerId, {
            relations: ['customerRank']
        }, '')

        this.customer = customer
    }

    public async assignReceiverCity(cityId: number) {
        const city = await City.findOneOrThrowId(cityId, null, '')
        this.receiverCity = city
    }

    public async assignCouponCampaign(couponCampaignId: number) {
        const couponCampaign = await CouponCampaign.findOneOrThrowId(couponCampaignId, {
            relations: ['couponCampaignDetails', 'couponCampaignDetails.product']
        }, '')
        this.couponCampaign = couponCampaign
    }

    public async assignReceiverDistrict(districtId: number) {
        const district = await District.findOneOrThrowId(districtId, null, '')
        this.receiverDistrict = district
    }

    public async assignReceiverWard(wardId: number) {
        const ward = await Ward.findOneOrThrowId(wardId, null, '')
        this.receiverWard = ward
    }

    public async assignSenderCity(cityId: number) {
        const city = await City.findOneOrThrowId(cityId, null, '')
        this.senderCity = city
    }

    public async assignSenderDistrict(districtId: number) {
        const district = await District.findOneOrThrowId(districtId, null, '')
        this.senderDistrict = district
    }

    public async assignSenderWard(wardId: number) {
        const ward = await Ward.findOneOrThrowId(wardId, null, '')
        this.senderWard = ward
    }


} // END FILE
