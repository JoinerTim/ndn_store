// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, PathParams, QueryParams } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Summary } from '@tsed/schema';;
import { Request } from 'express';


// IMPORT CUSTOM
import { Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import { DashboardService } from '../../services/DashboardService';
import { PromotionCampaignService } from '../../services/PromotionCampaignService';
import { FlashSaleCampaignService } from '../../services/FlashSaleCampaignService';


@Controller("/store/dashboard")
@Docs("docs_store")
export class DashboardController {
    constructor(
        private dashboardService: DashboardService,
        private promotionCampaignService: PromotionCampaignService,
        private flashSaleCampaignService: FlashSaleCampaignService
    ) { }

    @Get('/top/products')
    @UseAuth(VerificationJWT)
    async getTopProducts(
        @HeaderParams("token") token: string,
        @QueryParams('storeId') storeId: number,
        @QueryParams('fromAt') fromAt: number,
        @QueryParams('toAt') toAt: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const data = await this.dashboardService.topProducts({
            fromAt,
            toAt,
            storeId: req.store.id
        })

        return res.sendOK(data)
    }


    @Get('/summary/saleOrder')
    @UseAuth(VerificationJWT)
    async getSummarySaleOrder(
        @HeaderParams("token") token: string,
        @QueryParams('storeId') storeId: number,
        @QueryParams('fromAt') fromAt: number,
        @QueryParams('toAt') toAt: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const data = await this.dashboardService.summarySaleOrderByDate({
            fromAt,
            toAt,
            storeId: req.store.id
        })

        return res.sendOK(data)
    }

    @Get('/summary/sale/quantityProduct')
    @Summary("Thống kê sl sp bán ra theo ngày")
    @UseAuth(VerificationJWT)
    async getSummarySaleQuantityProduct(
        @HeaderParams("token") token: string,
        @QueryParams('storeId') storeId: number,
        @QueryParams('fromAt') fromAt: number,
        @QueryParams('toAt') toAt: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const data = await this.dashboardService.summaryQuantityByDate({
            fromAt,
            toAt,
            storeId: req.store.id
        })

        return res.sendOK(data)
    }

    @Get('/customer')
    @UseAuth(VerificationJWT)
    @Summary('Lấy tổng sl khách theo loại: khách mới, thường xuyên mua, lâu chưa mua')
    async getSummaryCustomerType(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const data = await this.dashboardService.summaryCustomer()

        return res.sendOK(data)
    }

    @Get('/coupon')
    @UseAuth(VerificationJWT)
    @Summary('Thống kê coupon giảm giá')
    async getSummaryCoupon(
        @HeaderParams("token") token: string,
        @QueryParams('storeId') storeId: number,
        @QueryParams('fromAt') fromAt: number,
        @QueryParams('toAt') toAt: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const data = await this.dashboardService.summaryCouponDiscount({
            fromAt,
            toAt,
            storeId: req.store.id
        })

        return res.sendOK(data)
    }

    @Get('/promotion/discountOrder')
    @UseAuth(VerificationJWT)
    @Summary('Thống kê k.mãi giảm giá đơn hàng')
    async getSummaryDiscountFixed(
        @HeaderParams("token") token: string,
        @QueryParams('storeId') storeId: number,
        @QueryParams('fromAt') fromAt: number,
        @QueryParams('toAt') toAt: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const data = await this.promotionCampaignService.summaryDiscountFixed({
            fromAt,
            toAt,
            storeId: req.store.id,
            limit: 0,
            page: 1
        })

        return res.sendOK(data)
    }

    @Get('/promotion/discountProduct')
    @UseAuth(VerificationJWT)
    @Summary('Thống kê k.mãi giảm giá sp')
    async getSummaryDiscountProduct(
        @HeaderParams("token") token: string,
        @QueryParams('storeId') storeId: number,
        @QueryParams('fromAt') fromAt: number,
        @QueryParams('toAt') toAt: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const data = await this.promotionCampaignService.summaryDiscountPercent({
            fromAt,
            toAt,
            storeId: req.store.id,
            limit: 0,
            page: 1
        })

        return res.sendOK(data)
    }


    @Get('/flashSale')
    @UseAuth(VerificationJWT)
    @Summary('Thống kê flash sale')
    async getSummaryFlashSale(
        @HeaderParams("token") token: string,
        @QueryParams('storeId') storeId: number,
        @QueryParams('fromAt') fromAt: number,
        @QueryParams('toAt') toAt: number,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const data = await this.flashSaleCampaignService.summaryDiscount({
            fromAt,
            toAt,
            storeId: req.store.id,
            limit: 0,
            page: 1
        })

        return res.sendOK(data)
    }




} // END FILE
