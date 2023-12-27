import ejs from 'ejs';
import template from './.babelrc.js.ejs?raw';


export default context => {
    return {
        createFileMap: () => {
            return {
                '/.babelrc.js': () => {
                    return ejs.render(template, context);
                }
            };
        },
        getDeps: () => ['@babel/core'],
        getDevDeps: () => {
            return [
                'babel',
                '@babel/preset-env',
                'babel-plugin-import',
                'babel-loader',
                ...(context.language === 'typescript' && [
                    '@babel/preset-typescript'
                ] || []),
                ...(context.frame === 'react' && [
                    '@babel/preset-react'
                ] || []),
            ].filter(Boolean);
        }
    };
}