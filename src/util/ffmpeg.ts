import ffmpeg from "fluent-ffmpeg";
import moment from "moment";
import path from "path";
import { v4 } from "uuid";
import CONFIG from "../../config";
import fs from "fs";
import { BadRequest } from "@tsed/exceptions";
import logger from "./logger";


export class FFMPEG {
    static getDuration(filePath: string): Promise<number> {
        return new Promise(resolve => {
            // console.log('start get meta', moment().valueOf());

            ffmpeg.ffprobe(filePath, (err, data) => {
                if (err) {
                    return resolve(0)
                }
                // console.log('end get meta', moment().valueOf());
                // console.log('ffprobe:', data)
                resolve(+data.format.duration.toFixed(0))
            })
        })
    }

    static webmToMp4(filePath: string): Promise<string> {
        return new Promise(resolve => {
            const folder = path.join(CONFIG.UPLOAD_DIR, 'video')
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder)
            }

            const filename = v4() + '.mp4'
            const newFilePath = path.join(folder, filename)

            ffmpeg(filePath)
                .output(newFilePath)
                .videoCodec('libx264')
                .on('end', () => {
                    console.log('webmToMp4 end');
                    resolve(newFilePath)
                })
                .on('error', err => {
                    if (err) {
                        console.log('webmToMp4 error', err);
                        throw err
                    }
                })
                .run();
        })
    }

    static getThumbnail(videoFilePath: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const folder = path.join(CONFIG.UPLOAD_DIR, 'thumbnails')
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder)
            }
            const filename = v4() + '.png'
            const newFile = path.join(folder, filename)

            ffmpeg(videoFilePath)
                .on('filenames', function (filenames) {
                    console.log('Will generate ' + filenames.join(', '))
                })
                .on('end', function () {
                    console.log('Screenshots taken');
                    resolve(newFile)
                })
                .on('error', function (err) {
                    console.log('ffmpeg error', err);
                    logger('error').error(`FFMPEG parse thumbnail error: file path: ${videoFilePath}`)
                    reject(err)
                })
                .screenshots({
                    // Will take screens at 20%, 40%, 60% and 80% of the video
                    count: 1,
                    folder,
                    filename
                });
        })
    }
}