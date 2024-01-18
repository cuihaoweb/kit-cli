import path from 'path';
// require('dotenv').config({path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV}`)});

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
const IS_CLIENT = process.env.MODE_ENV === 'client';
export const IS_SERVER = process.env.MODE_ENV === 'server';

/* ========================= 编译 ========================= */
const DEVTOOL = IS_DEVELOPMENT ? 'source-map' : 'nosources-source-map';

const serverResolve = pathname => path.resolve(SERVER_PATH, pathname);
const clientResolve = pathname => path.resolve(CLIENT_PATH, pathname);

export const conditionBack = (condition, value, value1) => {
    let res = {};
    if (value instanceof Array) {
        res = [];
    }
    return condition && value || value1 || res;
};
