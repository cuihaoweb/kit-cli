import fs from 'fs';
import {fileURLToPath} from 'url';
import {dirname, resolve} from 'path';
import ejs from 'ejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const resolveApp = (...paths) => resolve(__dirname, ...paths);

const FILE_MAP = {
    '/vite.config.js': () => {
        const str = fs.readFileSync(resolveApp('./config.ejs'), 'utf-8');
        const template = ejs.render(str, {name: '李白'});
        return template;
    }
};

export const createFileMap = (context) => {
    return FILE_MAP;
};
