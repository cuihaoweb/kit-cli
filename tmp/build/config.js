const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV}`)});

/* ========================= 环境 ========================= */
const IS_PRODUCT = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const MODE = IS_PRODUCT
    ? 'production'
    : IS_DEVELOPMENT ? 'development' : '';
const PORT = process.env.PORT;

/* ========================= 路径 ========================= */
const SRC_PATH = path.resolve(__dirname, '../src');
const ENTRY = path.resolve(SRC_PATH, './index.tsx');
const SERVER_PATH = path.resolve(__dirname, '../server');
const CLIENT_PATH = path.resolve(__dirname, '../client');
const OUTPUT = path.resolve(__dirname, '../dist');
const PUBLIC_PATH = IS_PRODUCT ? './' : '/';
const IS_CLIENT = process.env.BUILD_MODE === 'client';
const IS_SERVER = process.env.BUILD_MODE === 'server';

/* ========================= 编译 ========================= */
const DEVTOOL = IS_DEVELOPMENT ? 'source-map' : 'hidden-source-map';

const serverResolve = pathname => path.resolve(SERVER_PATH, pathname);
const clientResolve = pathname => path.resolve(CLIENT_PATH, pathname);

module.exports = {
    IS_PRODUCT,
    IS_DEVELOPMENT,
    MODE,
    SRC_PATH,
    SERVER_PATH,
    CLIENT_PATH,
    ENTRY,
    OUTPUT,
    PUBLIC_PATH,
    DEVTOOL,
    PORT,
    serverResolve,
    clientResolve,
    IS_CLIENT,
    IS_SERVER
};
