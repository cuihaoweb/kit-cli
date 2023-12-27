import ejs from 'ejs';
import webpackTemplate from './webpack.config.js.ejs?raw';
import webpackAnalyzeTemplate from './webpack.analyze.js.ejs?raw';


export default context => {
    return {
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
                'less-loader',
                'css-loader',
                'style-loader',
                'postcss-loader'
            ].filter(Boolean);
        }
    };
}