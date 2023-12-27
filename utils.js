import {fileURLToPath} from 'url';
import path, {dirname} from 'path';

/**
 * 路径规则：
 *  1. 如果没有被打包，那么import.meta.url始终指向源码的地址
 *  2. 如果被打包进入了主文件中，那么就会按照主文件路径进行解析
 */

export const curDirname = () => dirname(fileURLToPath(import.meta.url));
export const resolveApp = (...paths) => path.resolve(curDirname(), ...paths);

export const CWD_DIR = process.cwd();
