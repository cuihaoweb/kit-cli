import ejs from 'ejs';
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
                '/tsconfig.json': () => {
                    return ejs.render(tsTemplate, context);
                }
            };
        },
        getDeps: () => [],
        getDevDeps: () => {
            return [
                'typescript',
                ...(context.useCssModule && [
                    'typescript-plugin-css-modules'
                ] || [])
            ].filter(Boolean);
        }
    };
}
