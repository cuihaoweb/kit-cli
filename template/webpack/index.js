import ejs from 'ejs';
import {conditionBack} from '../../utils.js';
import webpackTemplate from './webpack.config.js.ejs?raw';
import webpackAnalyzeTemplate from './webpack.analyze.js.ejs?raw';


export default context => {
    return {
        name: 'webpack',
        createFileMap: () => {
            return {
                '/build/webpack.config.js': () => ejs.render(webpackTemplate, context),
                '/build/webpack.analyze.js': () => ejs.render(webpackAnalyzeTemplate, context)
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
                'css-loader',
                'style-loader',
                'postcss-loader',
                ...conditionBack(context.cssPreprocessor === 'less', ['less', 'less-loader']),
            ].filter(Boolean);
        }
    };
}