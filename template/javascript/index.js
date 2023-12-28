import ejs from 'ejs';
import {conditionBack} from '../../utils.js';
import jsTemplate from './jsconfig.json.ejs?raw';
import tsTemplate from './tsconfig.json.ejs?raw';


export default context => {
    return {
        name: 'javascript/typescript',
        createFileMap: () => {
            return {
                '/jsconfig.json': () => {
                    return ejs.render(jsTemplate, context);
                },
                ...(context.language === 'typescript' && {
                    '/tsconfig.json': () => ejs.render(tsTemplate, context)
                } || {})
            };
        },
        getDeps: () => [],
        getDevDeps: () => {
            return [
                ...conditionBack(context.language === 'typescript', ['typescript', 'tslib']),
                ...conditionBack(context.frame === 'svelte', ['@tsconfig/svelte']),
                ...conditionBack(context.useCssModule, ['typescript-plugin-css-modules'])
            ].filter(Boolean);
        }
    };
}
