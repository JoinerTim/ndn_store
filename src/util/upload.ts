import multer from "multer";
import * as fs from "fs";
import "reflect-metadata";
import { Request } from "express";
import { uuid } from "uuidv4";
import { BadRequest } from "@tsed/exceptions"


export const storage = multer.diskStorage({
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

export const fileFilter = (req: Request, file: any, cb: any) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        cb(null, true);
    } else {
        cb(new BadRequest("Chỉ cung cấp với ảnh dạng jpeg/png"));
    }
};

export const upload = multer({ storage: storage, fileFilter: fileFilter });