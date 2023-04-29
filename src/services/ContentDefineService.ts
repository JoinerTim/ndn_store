// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { ContentDefine, ContentDefineType } from "../entity/ContentDefine";
import { Store } from "../entity/Store";
import { StoreContentDefine } from "../entity/StoreContentDefine";

@Service()
export class ContentDefineService {

    list: ContentDefine[] = [];

    $onReady() {
        this.init();
    }

    public async init() {
        const types = Object.keys(ContentDefineType)
        for (const key of types) {
            let find = await ContentDefine.findOne({
                where: {
                    type: ContentDefineType[key],
                }
            })

            if (find) {
                continue;
            }
            find = new ContentDefine()
            find.body = 'Sample content';
            find.type = ContentDefineType[key];
            await find.save()
        }
    }

    public async initForStore(store: Store) {
        const types = Object.keys(ContentDefineType)
        for (const key of types) {
            let find = await StoreContentDefine.findOne({
                where: {
                    type: ContentDefineType[key],
                    store: store
                }
            })

            if (find) {
                continue;
            }
            find = new StoreContentDefine()
            find.body = 'Sample content';
            find.store = store
            find.type = ContentDefineType[key];
            await find.save()
        }
    }

    async getForStore(store: Store) {
        const [contentDefines, total] = await StoreContentDefine.findAndCount({
            where: {
                store
            }
        });


        return {
            contentDefines,
            total
        }
    }

} //END FILE
