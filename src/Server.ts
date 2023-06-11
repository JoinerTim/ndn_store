// IMPORT LIBRARY
import { Configuration, PlatformAcceptMimesMiddleware, Inject, PlatformApplication, Request, Response } from "@tsed/common";
import "@tsed/platform-express"; // /!\ keep this import
import "@tsed/typeorm";
import Path from "path";
import compression from "compression";
import bodyParser from "body-parser";
import cors from 'cors';
import methodOverride from 'method-override';
import timezone from 'moment-timezone';
import multer from "multer";
import moment from "moment";
import fs from 'fs';
import md5 from 'md5';
import "@tsed/swagger";
import { ServerOptions } from "https";

// IMPORT CUSTOM
import responseAPI from './middleware/response/responseAPI';
import { WrapperResponseFilter } from './middleware/response/CustomSendResponse';
import handleError from "./middleware/error/handleError";
import handleNotFound from "./middleware/error/handleNotFound";
import CONFIG from "../config";
import { getNameController, logSection } from "./util/helper";
import { sendMsgTelegram, telegramGroupIds } from "./util/teletegram";
import { v4 } from "uuid";
import path from "path";
import * as admin from "./controllers/admin/index";
import * as customer from "./controllers/customer/index";
import * as store from "./controllers/store/index";
import express from "express";
import { uuid } from "uuidv4";

process.setMaxListeners(0)

interface ProtocolPorts {
    httpsPort: string | boolean
    httpPort: string | boolean
}

// TIMEZONE
timezone.tz.setDefault("Asia/Ho_Chi_Minh");

const typeorm: any[] = [
    CONFIG.TYPE_ORM
]


// HANDLE HTTP/HTTPS
function handleProtocolPort(): ProtocolPorts {
    // if (process.env.PRODUCTION_MODE == "1")
    //     return {
    //         httpsPort: `${CONFIG.HOST}:${CONFIG.PORT}`,
    //         httpPort: false
    //     }

    return {
        httpPort: `${CONFIG.HOST}:${CONFIG.PORT}`,
        httpsPort: false
    }
}

function handleHttpsOptions(): ServerOptions {
    if (process.env.PRODUCTION_MODE == "1") {
        logSection('production mode')
        return {
            cert: fs.readFileSync(CONFIG.SSL),
            key: fs.readFileSync(CONFIG.SSL),
            ca: fs.readFileSync(__dirname + "/ssl/certificate-ca.crt")
        }
    }

    logSection('development mode')
    return {}
}


// HANDLE MULTER UPLOAD
function handleStorage(): multer.StorageEngine {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            //@ts-ignore
            const baseUrl = req.baseUrl;
            const segments = baseUrl.split("/");
            const pathName = segments[segments.length - 1];
            const pathFinal = `./uploads/${pathName}`;

            fs.mkdirSync(pathFinal, { recursive: true });

            cb(null, pathFinal);
        },
        filename: (req, file, cb) => {
            var fileExtension = file.originalname.substr(
                file.originalname.lastIndexOf(".") + 1
            );
            const uniqueSuffix = uuid() + "." + fileExtension;
            cb(null, uniqueSuffix);
        },
    });
}


// SERVER
const OPTION: any = {
    httpsOptions: handleHttpsOptions(),
    rootDir: __dirname,
    socketIO: {},
    statics: {
        "/uploads": [
            {
                root: path.join(__dirname, "../uploads"),
                hook: "$beforeRoutesInit",
            },
        ],
    },
    acceptMimes: ["application/json"],
    mount: {
        "/v1": [
            ...Object.values(admin),
            ...Object.values(customer),
            ...Object.values(store),
        ],
    },
    responseFilters: [WrapperResponseFilter],
    swagger: [
        {
            path: "/docs_admin",
            doc: "docs_admin",
            showExplorer: true,
            specVersion: "3.0.1",
        },
        {
            path: "/docs_customer",
            doc: "docs_customer",
            showExplorer: true,
            specVersion: "3.0.1",
        },
        {
            path: "/docs_store",
            doc: "docs_store",
            showExplorer: true,
            specVersion: "3.0.1",
        }
    ],
    typeorm,
    multer: {
        storage: handleStorage(),
    },
    logger: {
        logRequest: false,
        // logRequest: CONFIG.ENV != 'production',
        format: `%[%d{[hh:mm:ss dd/MM/yyyy}] %p%] %m`,
        requestFields: ["method", "url", "body", "query", "params"]
    }
}

// httpPort: '192.168.202.11:5000' 
const PORT = handleProtocolPort()
@Configuration({ ...OPTION, ...PORT })
export class Server {
    @Inject()
    app: PlatformApplication

    @Configuration()
    settings: Configuration

    public $beforeRoutesInit(): void | Promise<any> {
        this.app.use(PlatformAcceptMimesMiddleware)
            .use(cors())
            .use(compression())
            .use(methodOverride())
            .use(bodyParser.json())
            .use(bodyParser.urlencoded({
                extended: true
            }))
            .use((req, res: Response, next) => {
                res.removeHeader("x-powered-by");
                next();
            })
            .use(responseAPI)

        return null;
    }

    public $onReady() {
        logSection('server started')
        const date = moment().format("YYYY-MM-DD HH:mm:ss")
        // logger('info').info(`SERVER RESTART AT ${date}`)

        // if (!CONFIG.IS_DEV) {
        //     sendMsgTelegram(`SERVER ${CONFIG.APPLICATION_NAME} (${CONFIG.ENV}) vừa khởi động lại lúc ${date}`, telegramGroupIds.bmd)
        // }
    }

    public $afterRoutesInit() {
        this.app.use(handleNotFound)
            .use(handleError)
    }

    public $onServerInitError(err: any) {
        console.error(err);
        // logger('error').error("Error On Server Init: ", JSON.stringify(err))
    }
}
