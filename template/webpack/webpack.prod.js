const {merge} = require('webpack-merge');
// const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const webpackConfigCommon = require('./webpack.config');
// const CompressionPlugin = require('compression-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

/** @type{import('webpack').Configuration}*/
module.exports = merge(webpackConfigCommon, {
    mode: 'production',
    devtool: 'nosources-source-map',
    performance: {
        hints: 'warning'
    },
    optimization: {
        runtimeChunk: true,
        minimizer: [
            // new TerserPlugin(),
            new CssMinimizerPlugin({parallel: false})
        ],
        splitChunks: {
            chunks: 'all',
            minSize: 30 * 1024,
            maxSize: 1024 * 1024,
            minChunks: 1,
            maxAsyncRequests: 26,
            maxInitialRequests: 26,
            cacheGroups: {
                initialVender: {
                    priority: -6,
                    chunks: 'initial',
                    reuseExistingChunk: true,
                    test: /[\\/]node_modules[\\/]/,
                    name: 'initialVender',
                    filename: 'js/[name].[fullhash:8].js'
                },
                vender: {
                    priority: -7,
                    chunks: 'all',
                    reuseExistingChunk: true,
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vender',
                    filename: 'js/[name].[fullhash:8].js'
                }
            }
        }
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'assets/[name].[hash:8].css'
        }),
        // new CompressionPlugin(),
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, '../public'),
                    to: path.resolve(__dirname, '../dist')
                }
            ]
        })
    ]
});
