import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs-extra';

/**
 * 路径规则：
 *  1. 如果没有被打包，那么import.meta.url始终指向源码的地址
 *  2. 如果被打包进入了主文件中，那么就会按照主文件路径进行解析
 */

export const curDirname = () => dirname(fileURLToPath(import.meta.url));
export const resolveApp = (...paths) => path.resolve(curDirname(), ...paths);

export const CWD_DIR = process.cwd();
export const resolveCWD = (...paths) => path.resolve(CWD_DIR, ...paths);

export const conditionBack = (condition, value, value2) => {
    let res = {};
    if (value instanceof Array) {
        res = [];
    }
    return condition && value || value2 || res;
};

export const recursiveChmod = async (directoryPath, mode) => {
    try {
        const files = await fs.readdir(directoryPath);

        for (const file of files) {
            const filePath = `${directoryPath}/${file}`;
            const stats = await fs.stat(filePath);

            if (stats.isDirectory()) {
                await recursiveChmod(filePath, mode);
            }

            await fs.chmod(filePath, mode);
        }
    } catch (err) {
        console.error('Failed to recursively modify file permissions.');
        console.error(err);
    }
};
