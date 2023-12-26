import fs from 'fs';
import {fileURLToPath} from 'url';
import {dirname, resolve} from 'path';
import ejs from 'ejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const resolveApp = (...paths) => resolve(__dirname, ...paths);
let context = {};

// const FILE_MAP = {
//     '/package.json': () => {
//         const str = fs.readFileSync(resolveApp('./package.json.ejs'), 'utf-8');
//         const template = ejs.render(str, {name: context.name});
//         return template;
//     },
// };

// export const createFileMap = (_context) => {
//     Object.assign(context, _context);
//     return FILE_MAP;
// };

export default context => {
    return {
        createFileMap: () => {
            return {
                '/package.json': () => {
                    const str = fs.readFileSync(resolveApp('./package.json.ejs'), 'utf-8');
                    const template = ejs.render(str, context);
                    return template;
                }
            };
        }
    };
}
