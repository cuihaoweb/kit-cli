const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {MODE, ENTRY, OUTPUT, PUBLIC_PATH, DEVTOOL, SRC_PATH, IS_PRODUCT} = require('./config.js');

const baseStyleLoaderConf = [
    IS_PRODUCT
        ? ({
            loader: MiniCssExtractPlugin.loader,
            options: {publicPath: '../'}
        })
        : 'style-loader',
    {
        loader: require.resolve('css-loader'),
        options: {
            modules: {
                mode: 'local',
                auto: /\.module\.\w+$/i,
                localIdentName: '[path][name]__[local]',
                localIdentContext: SRC_PATH
            }
        }
    },
    'postcss-loader'
];

/** @type{import('webpack').Configuration}*/
module.exports = {
    mode: MODE,
    entry: [ENTRY].filter(Boolean),
    output: {
        path: OUTPUT,
        filename: 'js/[name]-[fullhash:8].bundle.js',
        publicPath: PUBLIC_PATH
    },
    cache: IS_PRODUCT ? false : {
        type: 'filesystem',
        allowCollectingMemory: true
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', 'css', 'less', 'scss'],
        alias: {
            '@': SRC_PATH
        },
        modules: [SRC_PATH, 'node_modules']
    },
    devtool: DEVTOOL,
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                include: SRC_PATH,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true
                        }
                    }
                    // IS_DEVELOPMENT && {
                    //     loader: 'swc-loader',
                    //     options: {
                    //         parseMap: true,
                    //         jsc: {
                    //             parser: {
                    //                 syntax: 'typescript',
                    //                 tsx: true,
                    //                 jsx: true,
                    //                 dynamicImport: true
                    //             },
                    //             transform: {
                    //                 react: {
                    //                     runtime: 'automatic',
                    //                     development: IS_DEVELOPMENT,
                    //                     refresh: IS_DEVELOPMENT
                    //                 }
                    //             }
                    //         }
                    //     }
                    // }
                ]
            },
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: [
                    ...baseStyleLoaderConf,
                    {
                        loader: 'sass-loader'
                    }
                ]
            },
            {
                test: /\.less$/,
                use: [
                    ...baseStyleLoaderConf,
                    {
                        loader: 'less-loader'
                    }
                ]
            },
            {
                test: /\.css$/,
                use: [
                    ...baseStyleLoaderConf
                ]
            },
            {
                test: /\.(woff|woff2|ttf|eot|svg|png|jpg|gif)(#.+)?$/,
                type: 'asset',
                generator: {
                    filename: 'assets/[name].[hash:8][ext][query]'
                },
                parser: {
                    dataUrlCondition: {
                        maxSize: 8 * 1024
                    }
                }
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../index.ejs'),
            templateParameters: {
                title: 'react App',
                baseUrl: IS_PRODUCT ? './' : '/'
            }
        }),
        new webpack.ProvidePlugin({
            // React: 'react'
        }),
        new webpack.DefinePlugin({
            process: JSON.stringify({
                env: {
                    NODE_ENV: process.env.NODE_ENV,
                    ASSET_PATH: PUBLIC_PATH
                }
            })
        })
    ]
};
