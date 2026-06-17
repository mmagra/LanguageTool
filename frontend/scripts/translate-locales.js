import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCALES_DIR = path.join(__dirname, '../public/locales');

import 'dotenv/config'; // Load .env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/translate';
// HARDCODED Languages List to avoid import issues
const LANGUAGES = {
    'Afrikaans': 'af',
    'Albanian': 'sq',
    'Amharic': 'am',
    'Arabic': 'ar',
    'Armenian': 'hy',
    'Azerbaijani': 'az',
    'Basque': 'eu',
    'Belarusian': 'be',
    'Bengali': 'bn',
    'Bosnian': 'bs',
    'Bulgarian': 'bg',
    'Catalan': 'ca',
    'Cebuano': 'ceb',
    'Chichewa': 'ny',
    'Chinese (Simplified)': 'zh-CN',
    'Chinese (Traditional)': 'zh-TW',
    'Corsican': 'co',
    'Croatian': 'hr',
    'Czech': 'cs',
    'Danish': 'da',
    'Dutch': 'nl',
    // English excluded as source
    'Esperanto': 'eo',
    'Estonian': 'et',
    'Filipino': 'tl',
    'Finnish': 'fi',
    'French': 'fr',
    'Frisian': 'fy',
    'Galician': 'gl',
    'Georgian': 'ka',
    'German': 'de',
    'Greek': 'el',
    'Gujarati': 'gu',
    'Haitian Creole': 'ht',
    'Hausa': 'ha',
    'Hawaiian': 'haw',
    'Hebrew': 'he',
    'Hindi': 'hi',
    'Hmong': 'hmn',
    'Hungarian': 'hu',
    'Icelandic': 'is',
    'Igbo': 'ig',
    'Indonesian': 'id',
    'Irish': 'ga',
    'Italian': 'it',
    'Japanese': 'ja',
    'Javanese': 'jv',
    'Kannada': 'kn',
    'Kazakh': 'kk',
    'Khmer': 'km',
    'Kinyarwanda': 'rw',
    'Korean': 'ko',
    'Kurdish (Kurmanji)': 'ku',
    'Kyrgyz': 'ky',
    'Lao': 'lo',
    'Latin': 'la',
    'Latvian': 'lv',
    'Lithuanian': 'lt',
    'Luxembourgish': 'lb',
    'Macedonian': 'mk',
    'Malagasy': 'mg',
    'Malay': 'ms',
    'Malayalam': 'ml',
    'Maltese': 'mt',
    'Maori': 'mi',
    'Marathi': 'mr',
    'Mongolian': 'mn',
    'Myanmar (Burmese)': 'my',
    'Nepali': 'ne',
    'Norwegian': 'no',
    'Odia (Oriya)': 'or',
    'Pashto': 'ps',
    'Persian': 'fa',
    'Polish': 'pl',
    'Portuguese': 'pt',
    'Punjabi': 'pa',
    'Romanian': 'ro',
    'Russian': 'ru',
    'Samoan': 'sm',
    'Scots Gaelic': 'gd',
    'Serbian': 'sr',
    'Sesotho': 'st',
    'Shona': 'sn',
    'Sindhi': 'sd',
    'Sinhala': 'si',
    'Slovak': 'sk',
    'Slovenian': 'sl',
    'Somali': 'so',
    'Spanish': 'es',
    'Sundanese': 'su',
    'Swahili': 'sw',
    'Swedish': 'sv',
    'Tajik': 'tg',
    'Tamil': 'ta',
    'Tatar': 'tt',
    'Telugu': 'te',
    'Thai': 'th',
    'Turkish': 'tr',
    'Turkmen': 'tk',
    'Ukrainian': 'uk',
    'Urdu': 'ur',
    'Uyghur': 'ug',
    'Uzbek': 'uz',
    'Vietnamese': 'vi',
    'Welsh': 'cy',
    'Xhosa': 'xh',
    'Yiddish': 'yi',
    'Yoruba': 'yo',
    'Zulu': 'zu'
};


// Define source files to process
const SOURCE_FILES = [
    'dashboard.json',
    'sidebar.json',
    'common.json',
    'inPerson.json',
    'conversations.json',
    'profile.json',
    'header.json',
    'roles.json',
    'helpSupport.json',
    'changePassword.json'
];

// Parse command line arguments for selective file translation
const args = process.argv.slice(2);
const requestedFiles = args.filter(arg => arg.endsWith('.json'));

const FILES_TO_PROCESS = requestedFiles.length > 0
    ? requestedFiles
    : SOURCE_FILES;

console.log(`\n📂 Files to process: ${FILES_TO_PROCESS.join(', ')}`);

async function main() {

    // Iterate over all languages
    for (const [name, code] of Object.entries(LANGUAGES)) {
        if (code === 'en') continue;

        console.log(`\n🌍 Processing ${name} (${code})...`);
        const targetDir = path.join(LOCALES_DIR, code);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // Iterate over filtered source files
        for (const filename of FILES_TO_PROCESS) {
            const sourcePath = path.join(LOCALES_DIR, 'en', filename);
            const targetPath = path.join(targetDir, filename);

            if (!fs.existsSync(sourcePath)) {
                console.warn(`⚠️  Source file not found: ${filename}`);
                continue;
            }

            console.log(`   📄 Reading ${filename}...`);
            const sourceContent = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

            // Specialized Logic: Conversational Placeholder
            // The user wants "Type your message in [Language]..." to be hardcoded and translated.
            // In English source: "Type your message in English..."
            // For other languages, we replace "English" with the Target Language Name *before* sending to API.
            // This ensures the translator sees: "Type your message in Spanish..." -> "Escribe tu mensaje en Español..."
            if (filename === 'conversations.json' && sourceContent.typePlaceholder) {
                sourceContent.typePlaceholder = sourceContent.typePlaceholder.replace('English', name);
            }

            // Load existing target file if it exists (to avoid re-translating unchanged keys)
            // Ideally we check diff, but for now we overwrite based on source keys.
            // Wait, we want to TRANSLATE.
            // The `translateObject` function updates missing translations or verifies?
            // Current implementation of `translateObject` blindly translates everything given to it?
            // No, it just calls API. 
            // We should PROBABLY read target file first to skip already existing keys?
            // The previous script didn't check target existence for skipping. 
            // Given the scope, let's stick to simple translation of the input object.

            const translatedContent = await translateObject(sourceContent, name, name);

            fs.writeFileSync(targetPath, JSON.stringify(translatedContent, null, 2));
            console.log(`   ✅ Saved ${code}/${filename}`);
        }
    }

    console.log('\n✨ All translations generated!');
}

main().catch(console.error);
async function translateObject(obj, targetLangName, targetLangCode) {
    // Helper to count valid keys for logging task size
    const countKeys = (o) => {
        let n = 0;
        for (const k in o) {
            if (typeof o[k] === 'object' && o[k] !== null) n += countKeys(o[k]);
            else if (typeof o[k] === 'string') n++;
        }
        return n;
    };

    // Refactored: One-by-one translation to match backend capabilities and avoid URL limits
    const flatten = (data, prefix = '') => {
        let result = {};
        for (const key in data) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof data[key] === 'object' && data[key] !== null) {
                Object.assign(result, flatten(data[key], newKey));
            } else {
                result[newKey] = data[key];
            }
        }
        return result;
    };

    const unflatten = (data) => {
        const result = {};
        for (const key in data) {
            const keys = key.split('.');
            let current = result;
            while (keys.length > 1) {
                const k = keys.shift();
                current[k] = current[k] || {};
                current = current[k];
            }
            current[keys[0]] = data[key];
        }
        return result;
    };

    const flatObj = flatten(obj);
    const translatedFlatObj = {};

    console.log(`      Translating ${Object.keys(flatObj).length} keys...`);

    for (const [key, value] of Object.entries(flatObj)) {
        if (!value) {
            translatedFlatObj[key] = value;
            continue;
        }

        try {
            // Delay to be nice to the free endpoint (avoid 429)
            await new Promise(resolve => setTimeout(resolve, 300));

            // Protect interpolation variables {{word}}
            const placeholders = [];
            const protectedValue = value.replace(/\{\{[\w\s]+\}\}/g, (match) => {
                placeholders.push(match);
                return `__PH_${placeholders.length - 1}__`;
            });

            // Skip translation if it's just a placeholder or number
            if (/^__PH_\d+__$/.test(protectedValue) || /^\d+$/.test(protectedValue)) {
                translatedFlatObj[key] = value;
                continue;
            }

            const response = await axios.post(API_BASE_URL, {
                text: protectedValue,
                targetLang: targetLangName
            });

            // The backend returns { translatedText: "..." }
            let translatedText = response.data.translatedText || response.data.translation || protectedValue;

            // Restore placeholders
            placeholders.forEach((ph, index) => {
                const regex = new RegExp(`__PH_${index}__`, 'g');
                translatedText = translatedText.replace(regex, ph);
            });

            translatedFlatObj[key] = translatedText;
            process.stdout.write('.'); // Progress indicator
        } catch (error) {
            console.warn(`\n      ⚠️ Error translating key '${key}': ${error.message}`);
            translatedFlatObj[key] = value; // Fallback
        }
    }
    console.log(); // Newline

    return unflatten(translatedFlatObj);
}
