import TelegramBot from "node-telegram-bot-api";
import CONFIG from "../../config";

// replace the value below with the Telegram token you receive from @BotFather
const token = CONFIG.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, {});
export const telegramGroupIds = {
    fclass: -1001770878806,
    bmd: -1001714774666,
}

export const sendMsgTelegram = async (msg: string, telegramGroupId, numOfBot = 1) => {
    try {
        let mainBot: TelegramBot = bot
        const maxSize = 4000;
        const amountSlice = Math.ceil(msg.length / maxSize);
        let start = 0
        let end = maxSize
        let message = '';
        for (let i = 0; i < amountSlice; i++) {
            message = msg.slice(start, end);
            start += maxSize;
            end += maxSize
            await mainBot.sendMessage(telegramGroupId, message, {
                parse_mode: 'HTML'
            })
        }


        console.log('send telegram ok');
    } catch (err) {
        console.log('sendMsgTelegram err', err);

    }

    // bot.get
}


