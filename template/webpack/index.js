import fs from 'fs';
import ejs from 'ejs';
import {fileURLToPath} from 'url';
import {dirname, resolve} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const resolveApp = (...paths) => resolve(__dirname, ...paths);

export default context => {
    return {
        createFileMap: () => {
            return {
                '/build/webpack.config.js': () => {
                    const str = fs.readFileSync(resolveApp('./webpack.config.js.ejs'), 'utf-8');
                    const template = ejs.render(str, context);
                    return template;
                },
                '/build/webpack.analyze.js': () => {
                    const str = fs.readFileSync(resolveApp('./webpack.analyze.js.ejs'), 'utf-8');
                    const template = ejs.render(str, context);
                    return template;
                }
            };
        },
        getDeps: () => [],
        getDevDeps: () => {
            return [
                'webpack',
                'webpack-cli',
                'webpack-dev-server',
                'copy-webpack-plugin',
                'html-webpack-plugin',
                'add-asset-html-webpack-plugin',
                'webpack-bundle-analyzer',
                'babel-loader',
                'less-loader',
                'css-loader',
                'style-loader',
                'postcss-loader'
            ].filter(Boolean);
        }
    };
}