import ejs from 'ejs';
import viteTemplate from './vite.config.ejs?raw';
import {conditionBack} from '../../utils.js';


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
                'vite',
                ...conditionBack(
                    context.frame === 'svelte' && context.mode === 'ssr',
                    ['@sveltejs/vite-plugin-svelte']
                ),
                ...conditionBack(context.cssPreprocessor === 'less', ['less'])
            ].filter(Boolean);
        }
    };
}
