import fs from 'fs';
import {fileURLToPath} from 'url';
import {dirname, resolve} from 'path';
import ejs from 'ejs';
import shelljs from 'shelljs';
import ora from 'ora'
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const resolveApp = (...paths) => resolve(__dirname, ...paths);

export default context => {
    return {
        createFileMap: async () => {
            return {
                '/.eslintrc.js': () => {
                    const str = fs.readFileSync(resolveApp('./.eslintrc.ejs'), 'utf-8');
                    const template = ejs.render(str);
                    return template;
                },
                '/.eslintignore': () => {
                    return fs.readFileSync(resolveApp('./.eslintignore.ejs'), 'utf-8');
                }
            };
        },
        getDeps: () => [],
        getDevDeps: async => {
            return ['eslint'];
        }
    };
}
