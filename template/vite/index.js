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
                    ['spa', 'ssr', 'component'].includes(context.mode),
                    ['vite-plugin-purgecss-v2']
                ),
                ...conditionBack(
                    context.frame === 'svelte' && context.mode === 'ssr',
                    ['@sveltejs/vite-plugin-svelte']
                ),
                ...conditionBack(context.cssPreprocessor === 'less', ['less'], ['sass']),
                ...conditionBack(context.env === 'node', ['vite-plugin-node'])
            ].filter(Boolean);
        }
    };
}
