#!/usr/bin/env node
import { program } from 'commander';
import { input, checkbox, confirm, select } from '@inquirer/prompts';
import ora from 'ora';
import fs, { constants } from 'fs';
import path, { dirname } from 'path';
import chalk from 'chalk';
import deepMerge from 'deepmerge';
import npmFetch from 'npm-registry-fetch';
import pLimit from 'p-limit';
import { cpus } from 'os';
// import { createFileMap as createViteFileMap } from './template/vite/index.js';
import packagejson from './template/packagejson/index.js';
import eslint from './template/eslint/index.js';
import javascript from './template/javascript/index.js';
import babel from './template/babel/index.js';
import webpack from './template/webpack/index.js';
import templateMap from './template/index.js';
import { resolveApp, resolveCWD } from './utils.js';

const limit = pLimit(cpus().length - 1);

program
    .command('create')
    .argument('[appName]', 'appName')
    .description('create app')
    .action(async (appName) => {
        try {
            /* ------------------------- 配置输入 ------------------------- */
            const context = {};
            let name = appName || '';
            !name && (name = await input({ message: '请输入应用名称', default: 'my-app' }));
            const env = await select({ message: '请选择运行的环境', choices: [{ value: 'web' }, { value: 'node' }], default: 'web' });
            const mode = await select({
                message: '请选择项目的类型',
                choices: (() => {
                    const HANDLE_MAP = {
                        web: () => [{ value: 'spa' }, { value: 'lib' }],
                        node: () => [{ value: 'lib' }, { value: 'ssr' }, { value: 'server' }]
                    };
                    return HANDLE_MAP[env]();
                })(),
                default: 'lib'
            });
            const frame = await select({
                message: '请选择使用的框架',
                choices: (() => {
                    if (mode === 'server') {
                        return [{ value: 'express' }, { value: 'koa' }, { value: 'none' }];
                    }
                    return [{ value: 'vue' }, { value: 'react' }, { value: 'svelte' }, { value: 'none' }];
                })(),
                default: 'vue'
            });
            const language = await select({
                message: '请选择要使用的语言',
                choices: [{ value: 'javascript' }, { value: 'typescript' }],
                default: 'javascript'
            });
            const useEslint = await confirm({ message: '是否使用eslint', default: true });
            let [cssPreprocessor, useCssModule] = ['none', false];
            if (!['lib', 'server'].includes(mode)) {
                cssPreprocessor = await select({
                    message: '请选择要使用的css预处理器',
                    choices: [{ value: 'less' }, { value: 'scss' }, { value: 'none' }],
                    default: 'less'
                });
                useCssModule = await confirm({ message: '是否开启css module', default: true });
            }
            let complier = 'webpack';
            if (env === 'node' || ['ssr', 'lib'].includes(mode)) {
                complier = 'vite';
            }
            Object.assign(context, {
                name, language, frame, env, mode, useEslint, useCssModule,
                cssPreprocessor, complier
            });

            /* ------------------------- 输出文件 ------------------------- */
            const spinner = ora('initializing').start();
            // ------------	公共文件 ------------
            const TMP_DIR = resolveCWD('./tmp');
            fs.mkdirSync(TMP_DIR, { recursive: true });
            fs.cpSync(resolveApp('./template/base'), TMP_DIR, { recursive: true });

            // ------------	不同工具链配置 ------------
            const TASK_QUEUE = [
                templateMap.babel,
                templateMap.eslint,
                templateMap.javascript,
                complier === 'webpack' ? templateMap.webpack : templateMap.vite,
            ];
            const KIT_MAP = {
                react:  ['react', 'react-dom'],
                vue: ['vue', 'vue-router']
            };
            const dependencies = new Set(KIT_MAP[frame] || []);
            const devDependencies = new Set(['rimraf', 'cross-env', 'wait-on', 'concurrently']);
            await Promise.all(
                TASK_QUEUE.map(func => limit(async () => {
                    const fn = () => {};
                    const {createFileMap = fn, getDeps = fn, getDevDeps = fn, name = ''} = func(context) || {};
                    const fileMap = (await createFileMap()) || {};
                    const devDeps = (await getDevDeps()) || [];
                    const deps = (await getDeps()) || [];

                    Object.entries(fileMap).forEach(([filePath, getContent]) => {
                        fs.writeFileSync(TMP_DIR + filePath, getContent() || '');
                    });

                    deps.forEach(dep => dependencies.add(dep));
                    devDeps.forEach(devDep => devDependencies.add(devDep));
                }))
            )

            // ------------	依赖包	------------
            await Promise.all(
                [...dependencies].map(dep => limit(async () => {
                    const { version } = await npmFetch.json(`/${dep}/latest`);
                    Object.assign(context, deepMerge(context, { dependencies: { [dep]: `^${version}` } }));
                }))
            );
            await Promise.all(
                [...devDependencies].map(dep => limit(async () => {
                    const { version } = await npmFetch.json(`/${dep}/latest`);
                    Object.assign(context, deepMerge(context, { devDependencies: { [dep]: `^${version}` } }));
                }))
            );

            // ------------	配置package.json文件 ------------
            try {
                const {createFileMap, name = ''} = templateMap.packagejson(context);
                Object.entries(await createFileMap()).forEach(([filePath, getContent]) => {
                    fs.writeFileSync(TMP_DIR + filePath, getContent() || '');
                });
            } catch {}

            spinner.succeed('create project succeed');
            console.log(chalk.green(
                [
                    '',
                    chalk.white('🚀 done, exec:'),
                    `   cd ${appName}`,
                    '   npm install',
                    '   npm run dev'
                ].join('\n')
            ));
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    });

program.parse();
