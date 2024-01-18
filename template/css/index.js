import postcssTemplate from './postcss.config.cjs?raw';
import tailwindTemplate from './tailwind.config?raw';
import {conditionBack} from '../../utils.js';


export default context => {
    return {
        name: 'css',
        createFileMap: () => {
            return {
                '/postcss.config.cjs': () => postcssTemplate,
                '/tailwind.config.js': () => tailwindTemplate
            };
        },
        getDeps: () => [
            ...conditionBack(
                ['spa', 'ssr', 'component'].includes(context.mode),
                ['tailwindcss']
            )
        ],
        getDevDeps: () => [
            ...conditionBack(
                ['spa', 'ssr', 'component'].includes(context.mode),
                [
                    'postcss',
                    'postcss-pxtorem',
                    'autoprefixer'
                ]
            )
        ]
    };
}
