import multer, { diskStorage } from "multer";
import fs from "fs";
import "reflect-metadata";
import { Request } from "express";
import { v4 as uuid } from "uuid";
import { BadRequest } from "@tsed/exceptions";

const storage: any = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        const pathFinal = `./uploads`;
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
        const fileExtension = file.originalname.substr(
            file.originalname.lastIndexOf(".") + 1
        );
        const uniqueSuffix = uuid() + "." + fileExtension;
        cb(null, uniqueSuffix);
    },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        cb(null, true);
    } else {
        cb(new BadRequest("Chỉ cung cấp với ảnh dạng jpeg/png"));
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

export { upload };
