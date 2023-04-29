require("dotenv").config();

const SECONDS_IN_1_YEAR = 60 * 60 * 24 * 30 * 12

const CONFIG = {
    IS_DEV: process.env.PRODUCTION_MODE == '0',
    ENV: process.env.ENV,
    APPLICATION_NAME: process.env.APPLICATION_NAME,
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    PUBLIC_URL: process.env.PUBLIC_URL,
    AUTH_KEY: process.env.AUTH_KEY,
    //Firebase
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    //ONE SIGNAL,
    ONE_SIGNAL_URL_CB: process.env.ONE_SIGNAL_URL_CB,
    ONE_SIGNAL_REST_API_KEY: process.env.ONE_SIGNAL_REST_API_KEY,
    ONE_SIGNAL_APP_ID: process.env.ONE_SIGNAL_APP_ID,
    //one signal client
    ONE_SIGNAL_CLIENT_APP_ID: process.env.ONE_SIGNAL_CLIENT_APP_ID,
    ONE_SIGNAL_CLIENT_REST_API_KEY: process.env.ONE_SIGNAL_CLIENT_REST_API_KEY,
    ONE_SIGNAL_CLIENT_URL_CB: process.env.ONE_SIGNAL_CLIENT_URL_CB,
    //one signal store
    ONE_SIGNAL_STORE_APP_ID: process.env.ONE_SIGNAL_STORE_APP_ID,
    ONE_SIGNAL_STORE_REST_API_KEY: process.env.ONE_SIGNAL_STORE_REST_API_KEY,
    ONE_SIGNAL_STORE_URL_CB: process.env.ONE_SIGNAL_STORE_URL_CB,
    //
    MERCHANT_URL: process.env.MERCHANT_URL,
    PREFIX_TABLE: process.env.DATABASE_PREFIX_TABLE,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: SECONDS_IN_1_YEAR,
    LOG_DIR: process.env.LOG_DIR,
    UPLOAD_DIR: process.env.UPLOAD_DIR,
    STATIC_DIR: process.env.STATIC_DIR,
    PREFIX_URL: process.env.PREFIX_URL,
    //MAIL
    MAIL_USER: process.env.MAIL_USER,
    MAIL_PASS: process.env.MAIL_PASS,
    //
    MAIL_SENDER: process.env.MAIL_SENDER,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    SSL: process.env.SSL,
    AWS_REGION: process.env.AWS_REGION,
    TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
    //
    API_VERSION: process.env.API_VERSION,
    APP_VERSION: process.env.APP_VERSION,
    AULAC_DB_ENABLE: process.env.AULAC_DB_ENABLE,
    //zalo
    ZALO_APP_ID: process.env.ZALO_APP_ID,
    ZALO_SECRET_KEY: process.env.ZALO_SECRET_KEY,
    TYPE_ORM: {
        type: process.env.DATABASE_TYPE,
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        bigNumberStrings: false,
        name: 'default',
        synchronize: true,
        extra: {
            "charset": "utf8mb4_unicode_ci"
        },
        entities: [
            `${__dirname}/src/entity/*{.ts,.js}`
        ],
        migrations: [
            `${__dirname}/src/migrations/*{.ts,.js}`
        ],
        subscribers: [
            `${__dirname}/src/subscriber/*{.ts,.js}`
        ]
    }
}

export default CONFIG
