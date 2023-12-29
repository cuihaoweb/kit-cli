import ejs from 'ejs';
import eslintignoreTemplate from './.eslintignore.ejs?raw';
import eslintrcTemplate from './.eslintrc.cjs.ejs?raw';


export default context => {
    return {
        name: 'eslint',
        createFileMap: () => {
            return {
                '/.eslintrc.cjs': () => ejs.render(eslintrcTemplate, context),
                '/.eslintignore': () => eslintignoreTemplate
            };
        },
        getDeps: () => [],
        getDevDeps: () => {
            return [
                'eslint',
                '@babel/eslint-parser',
                'eslint-plugin-simple-import-sort',
                ...(context.language === 'typescript' && [
                    '@typescript-eslint/eslint-plugin',
                    '@typescript-eslint/parser'
                ] || []),
                ...(context.frame === 'react' && [
                    'eslint-plugin-react',
                    'eslint-plugin-react-hooks'
                ] || []),
                ...(context.frame === 'vue' && [
                    'eslint-plugin-vue'
                ] || [])
            ].filter(Boolean);
        }
    };
}
