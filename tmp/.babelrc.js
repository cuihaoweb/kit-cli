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
    ].filter(Boolean),
    plugins: [
        // 'macros',
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