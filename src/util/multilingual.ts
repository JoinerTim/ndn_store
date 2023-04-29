import i18n, { Replacements } from 'i18n';
import path from "path";

import "./locales/vi.json"
import "./locales/en.json"
import { LangCode } from '../types/language';


i18n.configure({
    locales: ['vi', 'en', 'ko', 'zh'],
    directory: path.join(__dirname, 'locales'),
    register: global,
    defaultLocale: 'vi',
    mustacheConfig: {
        tags: ['{', '}'],
        disable: false
    },
});

export class Multilingual {
    static __(phrase: string, locale: LangCode = LangCode.Vi, replacements: Replacements = {}) {
        return i18n.__({ phrase, locale }, replacements)
    }
}
