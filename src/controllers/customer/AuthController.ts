// IMPORT LIBRARY
import { Controller, UseAuth, Req, Get, Res, Response, HeaderParams, Post, BodyParams, Patch, MultipartFile, Delete } from '@tsed/common';
import Joi from '@hapi/joi';
import { Docs } from '@tsed/swagger';
import { Summary } from '@tsed/schema';
import { Request } from 'express';


// IMPORT CUSTOM
import { ValidateFile, Validator } from '../../middleware/validator/Validator';
import { VerificationJWT } from '../../middleware/auth/VerificationJWT';
import JWT, { AuthType } from '../../middleware/auth/strategy/JWT';
import { Password } from '../../util/password';
import { Customer } from '../../entity/Customer';
import CONFIG from '../../../config';
import { CustomerInsert } from '../../entity-request/CustomerInsert';
import { CustomerService } from '../../services/CustomerService';
import { Otp } from '../../entity/OTP';
import { BadRequest, Forbidden } from '@tsed/exceptions';
import { CustomerCouponService } from '../../services/CustomerCouponService';
import { DeliveryAddressService } from '../../services/DeliveryAddressService';
import { DeliveryAddressType } from '../../entity/DeliveryAddress';
import { UseAuthHash } from '../../middleware/auth/UseAuthHash';
import { LangCode } from '../../types/language';
import { Multilingual } from '../../util/multilingual';
import { Store } from '../../entity/Store';
import { CustomerUpdate } from '../../entity-request/CustomerUpdate';
import { UseNamespace } from '../../middleware/auth/UseNamespace';
import { CustomerRankService } from '../../services/CustomerRankService';
import { RefCustomer, RefCustomerType } from '../../entity/RefCustomer';
import { CustomerTransactionService } from '../../services/CustomerTransactionService';

@Controller("/customer/auth")
@Docs("docs_customer")
export class AuthController {
    constructor(
        private customerService: CustomerService,
        private customerCouponService: CustomerCouponService,
        private deliveryAddressService: DeliveryAddressService,
        private customerRankService: CustomerRankService,
        private customerTransactionService: CustomerTransactionService
    ) { }


    // =====================LOGIN=====================
    @Post('/login')
    @UseNamespace()
    @Validator({
        password: Joi.string().required()
    })
    async login(
        @Res() res: Response,
        @Req() req: Request,
        @HeaderParams('lang') lang: LangCode,
        @HeaderParams('namespace') namespace: string,
        @BodyParams('username') phone: string,
        @BodyParams('password') password: string,
    ) {
        console.log('in')
        const customer = await this.customerService.login(phone, password, req.store, lang);

        const token = JWT.sign({ id: customer.id, type: AuthType.Customer });

        return res.sendOK({ token })
    }

    @Post('/check-exist')
    @UseNamespace()
    @Summary('Check tồn tại phone')
    @Validator({
        phone: Joi.required()
    })
    async checkExist(
        @HeaderParams('namespace') namespace: string,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('phone') phone: string,
        @HeaderParams('lang') lang: LangCode
    ) {

        const customer = await Customer.findOne({
            where: [
                {
                    phone: phone.trim(),
                    store: req.store,
                    isDeleted: false
                },
            ]
        });

        if (!customer) {
            return res.sendOK({})
        }

        if (customer.phone == phone) {
            const msgPhone = Multilingual.__('phone', lang)
            throw new BadRequest(Multilingual.__('auth.accountNotRegister', lang, {
                name: msgPhone
            }));
        }
    }

    @Post('/otp/forgot')
    @Summary('Lấy OTP để lấy lại pass')
    @UseNamespace()
    @Validator({
        phone: Joi.required()
    })
    async getOTPForgotPassword(
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('phone') phone: string,
        @HeaderParams('lang') lang: LangCode
    ) {

        let customer: Customer = null;

        customer = await Customer.findOne({
            where: {
                phone,
                store: req.store,
                isDeleted: false
            }
        })

        if (!customer) {
            throw new BadRequest(Multilingual.__('auth.accountNotRegister', lang));
        }

        if (customer.isBlocked) {
            throw new BadRequest(Multilingual.__('auth.accountBlocked', lang));
        }

        const otp = new Otp();
        otp.generateCode()
        otp.customer = customer;
        otp.phone = phone;
        await otp.save();


        return res.sendOK({})
    }

    @Post('/otp')
    @Summary('Lấy OTP để verify')
    @UseNamespace()
    @Validator({
        phone: Joi.required()
    })
    async getOTP(
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('phone') phone: string,
    ) {
        const otp = new Otp();
        otp.generateCode();
        otp.phone = phone;
        otp.store = req.store;
        await otp.save();

        return res.sendOK({})
    }

    @Post('/otp/verify')
    @UseNamespace()
    @Validator({
        code: Joi.required()
    })
    async verifyOtp(
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('code') code: string,
        @BodyParams('phone') phone: string,
        @HeaderParams('lang') lang: LangCode
    ) {
        if (CONFIG.ENV == 'staging' && code == '999999') {
            return res.sendOK({})
        }

        const otp = await Otp.findOneOrThrowOption({
            where: {
                code,
                isUsed: false,
                phone,
                store: req.store
            }
        }, 'OTP');

        if (otp.isExpired()) {
            otp.isUsed = true;
            await otp.save();
            throw new BadRequest(Multilingual.__('auth.otpExpired', lang));
        }

        otp.isUsed = true;
        await otp.save();


        res.sendOK({})
    }

    @Post('/otp/verify/forgotPassword')
    @UseNamespace()
    @Validator({
        code: Joi.required(),
        phone: Joi.required()
    })
    async verifyOtpForgotPassword(
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('code') code: string,
        @BodyParams('phone') phone: number,
        @HeaderParams('lang') lang: LangCode
    ) {
        if (CONFIG.ENV == 'staging' && code == '999999') {
            return res.sendOK({})
        }

        const customer = await Customer.findOneOrThrowOption({
            where: {
                phone,
                store: req.store
            }
        }, 'Số điện thoại');

        const otp = await Otp.findOneOrThrowOption({
            where: {
                code,
                isUsed: false,
                customer,
                phone,
                store: req.store
            }
        }, 'OTP');

        if (otp.isExpired()) {
            otp.isUsed = true;
            await otp.save()
            throw new BadRequest(Multilingual.__('auth.otpExpired', lang));
        }

        res.sendOK({})
    }

    // =====================REGISTER=====================
    @Post('/register')
    @UseAuthHash()
    @UseNamespace()
    @Validator({
        customer: Joi.required(),
    })
    async register(
        @BodyParams('customer') customer: CustomerInsert,
        @BodyParams('refCustomerId') refCustomerId: number,
        @BodyParams('isHasCoupon') isHasCoupon: boolean = true,
        @Res() res: Response,
        @Req() req: Request
    ) {
        const store = req.store

        const newCustomer = await customer.toCustomer();
        await this.customerService.validateDuplicate(newCustomer, store)
        await newCustomer.generateCode();
        newCustomer.store = store
        newCustomer.isVerified = false;
        if (refCustomerId) { await newCustomer.assignRefCustomer(refCustomerId) }
        const registerCustomer = await newCustomer.save();

        //cộng điểm cho người giới thiệu đăng kí
        if (refCustomerId) {
            await this.customerTransactionService.handleWhenCompleteRegister(registerCustomer, refCustomerId)
        }


        if (!customer.zaloId) {
            await this.deliveryAddressService.create({
                name: newCustomer.fullName,
                address: newCustomer.address,
                city: newCustomer.city,
                district: newCustomer.district,
                ward: newCustomer.ward,
                type: DeliveryAddressType.Home,
                isDefault: true,
                phone: newCustomer.phone,
                customer: newCustomer
            })
        }

        const token = JWT.sign({ id: newCustomer.id, type: AuthType.Customer });

        if (isHasCoupon) { await this.customerCouponService.handleWhenCustomerRegister(newCustomer.id) }

        return res.sendOK({ token })
    }

    @Post('/login/apple')
    @UseNamespace()
    @Validator({
        appleId: Joi.required()
    })
    async loginApple(
        @HeaderParams('lang') lang: LangCode,
        @BodyParams('appleId') appleId: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const customer = await Customer.findOne({ where: { appleId, isDeleted: false, store: req.store } })
        if (customer) {
            if (customer.isBlocked) {
                throw new Forbidden(Multilingual.__('auth.accountBlocked', lang));
            }
            const token = JWT.sign({ id: customer.id, type: AuthType.Customer })
            return res.sendOK({ token })
        } else {
            res.sendNotFound(Multilingual.__('auth.accountNotRegister', lang))
        }
    }


    @Post('/login/fb')
    @UseNamespace()
    @Validator({
        facebookId: Joi.required()
    })
    async loginFb(
        @HeaderParams('lang') lang: LangCode,
        @BodyParams('facebookId') facebookId: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const customer = await Customer.findOne({ where: { facebookId, isDeleted: false, store: req.store } })
        if (customer) {
            if (customer.isBlocked) {
                throw new Forbidden(Multilingual.__('auth.accountBlocked', lang));
            }
            const token = JWT.sign({ id: customer.id, type: AuthType.Customer })
            return res.sendOK({ token })
        } else {
            res.sendNotFound(Multilingual.__('auth.accountNotRegister', lang))
        }
    }

    @Post('/login/gg')
    @UseNamespace()
    @Validator({
        googleId: Joi.required()
    })
    async loginGoogle(
        @HeaderParams('lang') lang: LangCode,
        @BodyParams('googleId') googleId: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const customer = await Customer.findOne({ where: { googleId, isDeleted: false, store: req.store } })
        if (customer) {
            if (customer.isBlocked) {
                throw new Forbidden(Multilingual.__('auth.accountBlocked', lang));
            }
            const token = JWT.sign({ id: customer.id, type: AuthType.Customer })
            return res.sendOK({ token })
        } else {
            res.sendNotFound(Multilingual.__('auth.accountNotRegister', lang))
        }
    }

    // =====================PROFILE=====================
    @Post('/login/zalo')
    @UseNamespace()
    @Validator({
        zaloId: Joi.required()
    })
    async loginZalo(
        @HeaderParams('lang') lang: LangCode,
        @BodyParams('zaloId') zaloId: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const customer = await Customer.createQueryBuilder('customer')
            .leftJoinAndSelect('customer.store', 'store')
            .where('customer.zaloId = :zaloId AND customer.isDeleted = false AND store.id = :storeId', { zaloId, storeId: req.store.id })
            .getOne()
        if (customer) {
            if (customer.isBlocked) {
                throw new Forbidden(Multilingual.__('auth.accountBlocked', lang));
            }
            const token = JWT.sign({ id: customer.id, type: AuthType.Customer })
            return res.sendOK({ token })
        } else {
            res.sendNotFound(Multilingual.__('auth.accountNotRegister', lang))
        }
    }


    // =====================PROFILE=====================
    @Get('/profile')
    @UseAuth(VerificationJWT)
    @UseNamespace()
    async getInfo(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const customer = await Customer.findOne(req.customer.id, {
            relations: ['city', 'district', 'ward', 'customerRank'],
        })

        return res.sendOK(customer)
    }

    @Patch('/profile')
    @UseNamespace()
    @UseAuth(VerificationJWT)
    async updateProfile(
        @HeaderParams("token") token: string,
        @BodyParams('customer') customerUpdate: CustomerUpdate,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const customer = await customerUpdate.toCustomer()
        customer.id = req.customer.id;

        if (req.customer.isAllowChangeDob && customerUpdate.dob) {
            customer.dob = customerUpdate.dob
        }

        await customer.save();

        return res.sendOK(customer)
    }

    // =====================UPDATE PASSWORD=====================
    @Post('/password/update')
    @UseAuth(VerificationJWT)
    @Validator({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().required()
    })
    async changePassword(
        @HeaderParams("version") version: string,
        @HeaderParams("token") token: string,
        @HeaderParams("lang") lang: LangCode,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('oldPassword') oldPassword: string,
        @BodyParams('newPassword') newPassword: string,
    ) {
        const { customer } = req;

        await this.customerService.validatePassword(customer, oldPassword, Multilingual.__('auth.wrongOldPassword', lang))

        // Update password
        customer.password = await Password.hash(newPassword);
        await customer.save();

        return res.sendOK(customer);
    }

    @Post('/password/verify')
    @UseAuth(VerificationJWT)
    @Validator({
        password: Joi.required()
    })
    async verifyPassword(
        @HeaderParams("token") token: string,
        @HeaderParams("lang") lang: LangCode,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('password') password: string,
    ) {
        const customer = await Customer.findOne(req.customer.id, {
            select: ['password']
        });

        const isValid = await Password.validate(password, customer.password);
        if (!isValid) {
            throw new BadRequest(Multilingual.__('auth.wrongPassword', lang));
        }


        return res.sendOK({})
    }

    @Post('/reset-password')
    @UseNamespace()
    @Validator({
        resetCode: Joi.required(),
        password: Joi.required(),
        phone: Joi.string().min(1).required()
    })
    async resetPassword(
        @HeaderParams('lang') lang: LangCode,
        @Req() req: Request,
        @Res() res: Response,
        @BodyParams('resetCode') resetCode: string,
        @BodyParams('phone') phone: string,
        @BodyParams('password') password: string,
    ) {
        console.log('reset password', req.body);

        const customer = await Customer.createQueryBuilder('customer')
            .where('customer.phone = :phone AND customer.isDeleted = 0 AND customer.storeId = :storeId', {
                phone,
                storeId: req.store.id
            })
            .getOne();

        if (!customer) {
            throw new BadRequest(Multilingual.__('auth.accountNotExist', lang));

        }

        if (customer.isBlocked) {
            throw new BadRequest(Multilingual.__('auth.accountBlocked', lang));
        }

        console.log('vao day ne', CONFIG.ENV, 'resetCode', resetCode);
        if (CONFIG.ENV == 'staging') {
            console.log('vào staging nè');

            if (resetCode != '999999') {
                throw new BadRequest(Multilingual.__('auth.otpWrong', lang));

            }
        } else {
            const otp = await Otp.findOne({
                where: {
                    code: resetCode,
                    isUsed: false,
                    phone,
                    store: req.store
                }
            })


            if (!otp) {
                throw new BadRequest(Multilingual.__('auth.otpWrong', lang));
            }

            if (otp.isExpired()) {
                throw new BadRequest(Multilingual.__('auth.otpExpired', lang));
            }

            otp.isUsed = true;
            await otp.save()
        }

        customer.password = await Password.hash(password);
        await customer.save();

        res.sendOK({})
    }

    @Post('/fcm/sub')
    @UseAuth(VerificationJWT)
    @Summary('Sub fcm token')
    @Validator({
        fcmToken: Joi.required()
    })
    async subFcm(
        @HeaderParams("token") token: string,
        @BodyParams('fcmToken') fcmToken: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        if (fcmToken != req.customer.fcmToken) {
            req.customer.fcmToken = fcmToken
            await req.customer.save()
        }

        return res.sendOK({})
    }

    @Post('/logout')
    @UseAuth(VerificationJWT)
    @Validator({})
    async logout(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        req.customer.fcmToken = '';
        await req.customer.save()
        return res.sendOK({})
    }

    // =====================UPLOAD IMAGE=====================
    @Post('/upload')
    @UseAuth(VerificationJWT)
    @ValidateFile()
    async uploadFile(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
        @MultipartFile('file') file: Express.Multer.File,
    ) {

        file.path = file.path.replace(CONFIG.UPLOAD_DIR, '');

        return res.sendOK(file)
    }

    @Delete('/')
    @UseAuth(VerificationJWT)
    @UseAuthHash()
    async delete(
        @HeaderParams("token") token: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        req.customer.isDeleted = true

        await req.customer.save()

        return res.sendOK({})
    }
} // END FILE
