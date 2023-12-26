import fs from 'fs';
import {fileURLToPath} from 'url';
import {dirname, resolve} from 'path';
import ejs from 'ejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const resolveApp = (...paths) => resolve(__dirname, ...paths);

export default context => {
    return {
        createFileMap: () => {
            return {
                '/jsconfig.json': () => {
                    const str = fs.readFileSync(resolveApp('./jsconfig.json.ejs'), 'utf-8');
                    const template = ejs.render(str, context);
                    return template;
                },
                '/tsconfig.json': () => {
                    const str = fs.readFileSync(resolveApp('./tsconfig.json.ejs'), 'utf-8');
                    const template = ejs.render(str, context);
                    return template;
                }
            };
        },
        getDeps: () => [],
        getDevDeps: () => {
            return [
                'typescript',
                ...(context.useCssModule && [
                    'typescript-plugin-css-modules'
                ] || [])
            ].filter(Boolean);
        }
    };
}
