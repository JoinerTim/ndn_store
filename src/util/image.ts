import Jimp from 'jimp'
import path from 'path';
import { v4 } from 'uuid';
import im from "imagemagick"

interface ResizeParam {
    width: number
    height?: number
    imagePath: string
    destDir: string
}

export class ImageUtil {
    static async resize({ width, height = Jimp.AUTO, imagePath, destDir }: ResizeParam) {
        const image = await Jimp.read(imagePath)
        const extension = image.getExtension();

        image.resize(width, height)

        const newPath = path.join(destDir, v4() + '.' + extension)
        image.writeAsync(newPath);

        return newPath;
    }

    static compress(filePath: string, newDir: string): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const ext = path.extname(filePath)
                const mimetype = ext == '.png' ? 'PNG' : 'JPEG';
                console.log('mimetype:', mimetype)
                const newFilename = v4() + ext;
                const newPath = path.join(newDir, newFilename)
                console.log('compress newPath:', newPath)
                im.convert([filePath, '-sampling-factor', '4:2:0', '-strip', '-quality', '90', '-interlace', mimetype, '-colorspace', 'sRGB', newPath], (err, res) => {
                    if (err) {
                        return reject(err)
                    }

                    resolve(newPath)
                })
            } catch (error) {
                reject(error)
            }

        })

    }
}