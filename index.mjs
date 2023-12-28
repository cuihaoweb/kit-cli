#!/usr/bin/env node
import { program } from 'commander';
import { input, checkbox, confirm, select } from '@inquirer/prompts';
import ora from 'ora';
// import fs, { constants } from 'fs';
import fs from 'fs-extra';
import path, { dirname } from 'path';
import chalk from 'chalk';
import deepMerge from 'deepmerge';
import npmFetch from 'npm-registry-fetch';
import pLimit from 'p-limit';
import { cpus } from 'os';
import templateMap from './template/index.js';
import sourceCode from './template/code/index.js';
import { resolveApp, resolveCWD, conditionBack, recursiveChmod } from './utils.js';

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
            // const env = await select({ message: '请选择运行的环境', choices: [{ value: 'web' }, { value: 'node' }], default: 'web' });
            const mode = await select({
                message: '请选择项目的类型',
                choices: [{ value: 'spa' }, { value: 'ssr' }, { value: 'lib' }, { value: 'server' }, { value: 'component' }],
                default: 'spa'
            });
            let frame = 'none';
            if (mode !== 'lib') {
                frame = await select({
                    message: '请选择使用的框架',
                    choices: (() => {
                        if (mode === 'server') {
                            return [{ value: 'express' }, { value: 'koa' }, { value: 'none' }];
                        }
                        return [{ value: 'react' }, { value: 'vue' }, { value: 'svelte' }, { value: 'none' }];
                    })(),
                    default: 'react'
                });
            }
            const language = await select({
                message: '请选择要使用的语言',
                choices: [{ value: 'javascript' }, { value: 'typescript' }],
                default: 'javascript'
            });
            let [cssPreprocessor, useCssModule] = ['none', false];
            if (!['lib', 'server'].includes(mode)) {
                cssPreprocessor = await select({
                    message: '请选择要使用的css预处理器',
                    choices: [{ value: 'less' }, { value: 'scss' }, { value: 'none' }],
                    default: 'less'
                });
                if (!['vue', 'svelte'].includes(frame)) {
                    useCssModule = await confirm({ message: '是否开启css module', default: true });
                }
            }
            const useEslint = await confirm({ message: '是否使用eslint', default: true });
            let complier = 'webpack';
            if (['ssr', 'lib'].includes(mode)) {
                complier = 'vite';
            }
            Object.assign(context, {
                name, language, frame, mode, useEslint, useCssModule,
                cssPreprocessor, complier
            });

            /* ------------------------- 输出文件 ------------------------- */
            const spinner = ora('initializing').start();
            // ------------	公共文件 ------------
            const WORKSPACE_DIR = resolveCWD(`./${name}`); // 工作目录
            const basePath = resolveApp('./template/base');
            await recursiveChmod(basePath, 0o777);
            fs.cpSync(basePath, WORKSPACE_DIR, { recursive: true });

            // ------------	不同工具链配置 ------------
            const TASK_QUEUE = [
                ...conditionBack(complier === 'webpack', [
                    templateMap.babel,
                    templateMap.webpack
                ], [templateMap.vite]),
                templateMap.eslint,
                templateMap.javascript
            ];
            const dependencies = new Set([
                ...conditionBack(frame === 'react', ['react', 'react-dom']),
                ...conditionBack(frame === 'vue', ['vue', 'vue-router']),
                ...conditionBack(frame === 'svelte', ['svelte'])
            ]);
            const devDependencies = new Set([
                'rimraf', 'cross-env',
                ...conditionBack(['lib', 'ssr'].includes(mode), ['wait-on', 'concurrently'])
            ]);
            await Promise.all(
                TASK_QUEUE.map(func => limit(async () => {
                    const fn = () => { };
                    const { createFileMap = fn, getDeps = fn, getDevDeps = fn } = func(context) || {};
                    const fileMap = (await createFileMap()) || {};
                    const devDeps = (await getDevDeps()) || [];
                    const deps = (await getDeps()) || [];

                    Object.entries(fileMap).forEach(([filePath, getContent]) => {
                        fs.writeFileSync(WORKSPACE_DIR + filePath, getContent() || '');
                    });

                    deps.forEach(dep => dependencies.add(dep));
                    devDeps.forEach(devDep => devDependencies.add(devDep));
                }))
            );

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
                const { createFileMap } = templateMap.packagejson(context);
                Object.entries(await createFileMap()).forEach(([filePath, getContent]) => {
                    fs.writeFileSync(WORKSPACE_DIR + filePath, getContent() || '');
                });
            } catch (err) {
                throw new Error(err);
            }

            // ------------ 拷贝源码 ------------
            const { getCodePath } = sourceCode(context);
            const codePath = resolveApp('./template/code', getCodePath());
            /**
             * 拷贝文件
             * 1. 拷贝文件之前，需要确保文件有读写的权限，否则递归拷贝的过程中会报错
             */
            await recursiveChmod(codePath, 0o777);
            fs.cpSync(codePath, WORKSPACE_DIR, { recursive: true });

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
