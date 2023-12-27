import fs from 'fs';
import ejs from 'ejs';
import viteTemplate from './vite.config.ejs?raw';


const FILE_MAP = {
    '/vite.config.js': () => ejs.render(viteTemplate, {name: '李白'})
};

export const createFileMap = (context) => {
    return FILE_MAP;
};
