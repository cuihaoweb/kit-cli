const {resolve} = require('path');
const {IS_DEVELOPMENT, IS_PRODUCT} = require('./build/config');

module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                browsers: ['ie >= 8', 'iOS 7']
            },
            useBuiltIns: 'usage',
            corejs: 3
        }],
        ['@babel/preset-react', {
            runtime: 'automatic',
            development: IS_DEVELOPMENT
        }],
        ['@babel/preset-typescript', {
        }]
    ].filter(Boolean),
    plugins: [
        IS_DEVELOPMENT && "react-refresh/babel",
        'macros',
        // ['import', {
        //     libraryName: 'antd',
        //     style: true,
        //     libraryDirectory: 'lib'
        // }, 'antd'],
        ['import', {
            libraryName: 'react-components',
            style: name => `${name}/index.css`,
            libraryDirectory: 'lib',
        }, 'react-components'],
    ].filter(Boolean)
};