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
                '/.babelrc.js': () => {
                    const str = fs.readFileSync(resolveApp('./.babelrc.js.ejs'), 'utf-8');
                    const template = ejs.render(str, context);
                    return template;
                }
            };
        },
        getDeps: () => ['@babel/core'],
        getDevDeps: () => {
            return [
                'babel',
                '@babel/preset-env',
                'babel-plugin-import',
                'babel-loader',
                ...(context.language === 'typescript' && [
                    '@babel/preset-typescript'
                ] || []),
                ...(context.frame === 'react' && [
                    '@babel/preset-react'
                ] || []),
            ].filter(Boolean);
        }
    };
}