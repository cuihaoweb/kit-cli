const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const {MODE, ENTRY, OUTPUT, PUBLIC_PATH, DEVTOOL, SRC_PATH, IS_PRODUCT, IS_DEVELOPMENT} = require('./config.js');


const conditionBack = (condition, value) => {
    const res = {};
    if (value instanceof Array) {
        res = [];
    }
    return condition && value || res;
};

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
    ...conditionBack(IS_DEVELOPMENT, {
        devServer: {
            port: PORT,
            open: true,
            hot: true,
            compress: true,
            client: {
                overlay: false
            },
            proxy: {
                '/api/': {
                    target: 'http://localhost:3000',
                    secure: false,
                    changeOrigin: true,
                    pathRewrite: {'^/api/': '/'}
                }
            }
        }
    }),
    ...conditionBack(IS_PRODUCT, {
        performance: {
            hints: 'warning'
        }
    }),
    optimization: {
        runtimeChunk: true,
        ...conditionBack(IS_DEVELOPMENT, {
            removeEmptyChunks: false,
            splitChunks: false,
        }),
        ...conditionBack(IS_PRODUCT, {
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
        })
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
    ].concat(
        conditionBack(IS_DEVELOPMENT, [
            new ReactRefreshWebpackPlugin({overlay: false})
        ])
    ).concat(
        conditionBack(IS_PRODUCT, [
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
        ])
    )
};
