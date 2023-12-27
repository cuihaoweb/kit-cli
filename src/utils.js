import {fileURLToPath} from 'url';
import path, {dirname} from 'path';

export const curDirname = () => dirname(fileURLToPath(import.meta.url));
export const resolveApp = (...paths) => path.resolve(curDirname(), ...paths);

export const CWD_DIR = process.cwd();
