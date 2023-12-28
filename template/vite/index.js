import ejs from 'ejs';
import viteTemplate from './vite.config.ejs?raw';


export default context => {
    return {
        name: 'vite',
        createFileMap: () => {
            return {
                '/vite.config.js': () => ejs.render(viteTemplate, context)
            };
        },
        getDeps: () => [],
        getDevDeps: () => {
            return [
                'vite'
            ].filter(Boolean);
        }
    };
}
