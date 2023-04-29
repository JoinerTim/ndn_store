// IMPORT LIBRARY
import { Service } from "@tsed/common";


// IMPORT CUSTOM
import { Configuration, ConfigurationDataType, ConfigurationParam } from "../entity/Configuration";
import { Store } from "../entity/Store";

const configurationDefaultValues = [
    {
        param: ConfigurationParam.ShipFeeFromStore,
        value: '30000',
        dataType: ConfigurationDataType.Number
    },
    {
        param: ConfigurationParam.PointRefundRate,
        value: '0.01',
        dataType: ConfigurationDataType.Number
    },
    {
        param: ConfigurationParam.RewardPoint,
        value: '200',
        dataType: ConfigurationDataType.Number
    },
    {
        param: ConfigurationParam.RefRegisterPoint,
        value: '1000',
        dataType: ConfigurationDataType.Number
    },
]

@Service()
export class ConfigurationService {
    configurations: Configuration[] = [];

    async $onReady() {
        await this.init();
        await this.getConfigurations();

    }

    async getConfigurations() {
        console.log('+++++getConfigurations:')
        this.configurations = await Configuration.find();
    }


    public async init(store?: Store) {
        for (const item of configurationDefaultValues) {
            const find = await Configuration.findOne({
                where: {
                    param: item.param,
                    store
                }
            })

            if (!find) {
                const configuration = new Configuration()
                configuration.value = item.value;
                configuration.dataType = item.dataType;
                configuration.param = item.param;
                configuration.store = store;
                await configuration.save();
            }
        }
    }

} //END FILE
