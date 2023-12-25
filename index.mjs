#!/usr/bin/env node
import {program} from 'commander';
import {input, checkbox, confirm, select} from '@inquirer/prompts';
import ora from 'ora';
import fs from 'fs';
import path, {dirname} from 'path';
import chalk from 'chalk';
import deepMerge from 'deepmerge';
import npmFetch from 'npm-registry-fetch';
import {createFileMap as createViteFileMap} from './template/vite/index.js';
import packagejson from './template/packagejson/index.js';
import eslint from './template/eslint/index.js';
import {createFileMap as createJavascriptFileMap} from './template/javascript/index.js';
import {createFileMap as createBabelFileMap} from './template/babel/index.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
const resolveApp = (...paths) => path.resolve(dirname(''), ...paths);

program
    .command('create')
    .argument('[appName]', 'appName')
    .description('create app')
    .action(async (appName) => {
        let context = {};
        let name = appName || '';
        !name && (name = await input({message: '请输入应用名称', default: 'my-app'}));
        // const env = await select({message: '请选择运行的环境', choices: [{value: 'web'}, {value: 'node'}], default: 'web'});
        // const mode = await select({
        //     message: '请选择运行的环境',
        //     choices: (() => {
        //         const HANDLE_MAP = {
        //             web: () => [{value: 'spa'}, {value: 'lib'}],
        //             node: () => [{value: 'lib'}, {value: 'ssr'}]
        //         }
        //         return HANDLE_MAP[env]();
        //     })(),
        //     default: 'lib'
        // });
        // const frame = await select({
        //     message: '请选择使用的框架',
        //     choices: [{value: 'vue'}, {value: 'react'}, {value: 'svelte'}, {value: 'none'}],
        //     default: 'vue'
        // });
        // const language = await select({
        //     message: '请选择要使用的语言',
        //     choices: [{value: 'javascript'}, {value: 'typescript'}],
        //     default: 'javascript'
        // });
        // const useEslint = await confirm({message: '是否使用eslint', default: this});
        Object.assign(context, {name});
        // Object.assign(context, {name, env, mode, frame, language, useEslint});

        const TMP_DIR = resolveApp('./tmp');
        fs.mkdirSync(TMP_DIR, {recursive: true});

        // // .vscode 相关配置
        // fs.cpSync(resolveApp('./template/.vscode'), TMP_DIR + '/.vscode', {recursive: true});

        // // vite相关配置
        // const viteFileMap = createViteFileMap(context);
        // Object.keys(viteFileMap).forEach(key => {
        //     const content = viteFileMap[key]();
        //     fs.writeFileSync(TMP_DIR + key, content);
        // });

        // // jsconfig.json
        // const javascriptFileMap = createJavascriptFileMap(context);
        // Object.keys(javascriptFileMap).forEach(key => {
        //     const content = javascriptFileMap[key]();
        //     fs.writeFileSync(TMP_DIR + key, content);
        // });

        // // babel
        // const babelFileMap = createBabelFileMap(context);
        // Object.keys(babelFileMap).forEach(key => {
        //     const content = babelFileMap[key]();
        //     fs.writeFileSync(TMP_DIR + key, content);
        // });

         // eslint相关配置
        const {createFileMap: createEslintFileMap, getDevDeps} = eslint(context);
        const eslintFileMap = createEslintFileMap();
        Object.keys(eslintFileMap).forEach(key => {
            const content = eslintFileMap[key]();
            fs.writeFileSync(TMP_DIR + key, content);
        });
        // (await getDevDeps()).forEach(async dep => {
        //     const {version} = await npmFetch.json(`/${dep}/latest`);
        //     deepMerge(context, {devDependencies: {dep: `^${version}`}});
        // });
        const {version} = await npmFetch.json(`eslint/latest`);
        context = deepMerge(context, {devDependencies: {eslint: `^${version}`, lodash: '^1'}});

        // package.json
        const {createFileMap: createPackageJsonFileMap} = packagejson(context);
        const packageJsonFileMap = createPackageJsonFileMap(context);
        Object.keys(packageJsonFileMap).forEach(key => {
            const content = packageJsonFileMap[key]();
            fs.writeFileSync(TMP_DIR + key, content);
        });

        const spinner = ora('Loading unicorns').start();
        spinner.color = 'yellow';
	    spinner.text = 'Loading rainbows';

        spinner.succeed('create succeed');
        console.log(chalk.blue(
            [
                'done, exec:',
                `   cd ${appName}`,
                '   npm install',
                '   npm run dev'
            ].join('\n')
        ));
    });

program.parse();