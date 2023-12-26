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
import { createFileMap as createViteFileMap } from './template/vite/index.js';
import packagejson from './template/packagejson/index.js';
import eslint from './template/eslint/index.js';
import javascript from './template/javascript/index.js';
import babel from './template/babel/index.js';
import webpack from './template/webpack/index.js';
import { createFileMap as createBabelFileMap } from './template/babel/index.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
const resolveApp = (...paths) => path.resolve(dirname(''), ...paths);
const limit = pLimit(cpus().length - 1);

program
    .command('create')
    .argument('[appName]', 'appName')
    .description('create app')
    .action(async (appName) => {
        try {
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

            const TMP_DIR = resolveApp('./tmp');
            fs.mkdirSync(TMP_DIR, { recursive: true });

            const spinner = ora('initializing').start();

            // 基础依赖
            await Promise.all(
                ['rimraf', 'cross-env'].map(dep => limit(async () => {
                    const { version } = await npmFetch.json(`/${dep}/latest`);
                    Object.assign(context, deepMerge(context, { devDependencies: { [dep]: `^${version}` } }));
                }))
            );
            await Promise.all(
                ['react', 'react-dom'].map(dep => limit(async () => {
                    const { version } = await npmFetch.json(`/${dep}/latest`);
                    Object.assign(context, deepMerge(context, { dependencies: { [dep]: `^${version}` } }));
                }))
            );

            // .vscode 相关配置
            fs.cpSync(resolveApp('./template/base'), TMP_DIR, { recursive: true });

            // // vite相关配置
            // const viteFileMap = createViteFileMap(context);
            // Object.keys(viteFileMap).forEach(key => {
            //     const content = viteFileMap[key]();
            //     fs.writeFileSync(TMP_DIR + key, content);
            // });

            // webpack相关配置
            if (complier === 'webpack') {
                spinner.stop();
                const javascriptSpinner = ora('initializing webpack').start();
                const { createFileMap, getDevDeps, getDeps } = webpack(context);
                const fileMap = createFileMap();
                Object.keys(fileMap).forEach(key => {
                    const content = fileMap[key]();
                    fs.writeFileSync(TMP_DIR + key, content);
                });
                await Promise.all(
                    (await getDevDeps()).map(dep => limit(async () => {
                        const { version } = await npmFetch.json(`/${dep}/latest`);
                        Object.assign(context, deepMerge(context, { devDependencies: { [dep]: `^${version}` } }));
                    }))
                );
                await Promise.all(
                    (await getDeps()).map(dep => limit(async () => {
                        const { version } = await npmFetch.json(`/${dep}/latest`);
                        Object.assign(context, deepMerge(context, { dependencies: { [dep]: `^${version}` } }));
                    }))
                );
                javascriptSpinner.succeed('create webpack succeed');
                spinner.start();
            }

            // jsconfig.json
            spinner.stop();
            const javascriptSpinner = ora('initializing javascript').start();
            const { createFileMap: createJavascriptFileMap, getDevDeps: getJavascriptDevDeps, getDeps: getJavascriptDeps } = javascript(context);
            const javascriptFileMap = createJavascriptFileMap();
            Object.keys(javascriptFileMap).forEach(key => {
                const content = javascriptFileMap[key]();
                fs.writeFileSync(TMP_DIR + key, content);
            });
            await Promise.all(
                (await getJavascriptDevDeps()).map(dep => limit(async () => {
                    const { version } = await npmFetch.json(`/${dep}/latest`);
                    Object.assign(context, deepMerge(context, { devDependencies: { [dep]: `^${version}` } }));
                }))
            );
            await Promise.all(
                (await getJavascriptDeps()).map(dep => limit(async () => {
                    const { version } = await npmFetch.json(`/${dep}/latest`);
                    Object.assign(context, deepMerge(context, { dependencies: { [dep]: `^${version}` } }));
                }))
            );
            javascriptSpinner.succeed('create eslint succeed');
            spinner.start();

            // // babel
            spinner.stop();
            const babelSpinner = ora('initializing babel').start();
            const { createFileMap: createBabelFileMap, getDevDeps: getBabelDevDeps, getDeps: getBabelDeps } = babel(context);
            const babelFileMap = createBabelFileMap();
            Object.keys(babelFileMap).forEach(key => {
                const content = babelFileMap[key]();
                fs.writeFileSync(TMP_DIR + key, content);
            });
            await Promise.all(
                (await getBabelDevDeps()).map(dep => limit(async () => {
                    const { version } = await npmFetch.json(`/${dep}/latest`);
                    Object.assign(context, deepMerge(context, { devDependencies: { [dep]: `^${version}` } }));
                }))
            );
            await Promise.all(
                (await getBabelDeps()).map(dep => limit(async () => {
                    const { version } = await npmFetch.json(`/${dep}/latest`);
                    Object.assign(context, deepMerge(context, { dependencies: { [dep]: `^${version}` } }));
                }))
            );
            babelSpinner.succeed('create babel succeed');
            spinner.start();

            // eslint相关配置
            if (useEslint) {
                spinner.stop();
                const eslintSpinner = ora('initializing eslint').start();
                const { createFileMap: createEslintFileMap, getDevDeps } = eslint(context);
                const eslintFileMap = createEslintFileMap();
                Object.keys(eslintFileMap).forEach(key => {
                    const content = eslintFileMap[key]();
                    fs.writeFileSync(TMP_DIR + key, content);
                });
                await Promise.all(
                    (await getDevDeps()).map(dep => limit(async () => {
                        const { version } = await npmFetch.json(`/${dep}/latest`);
                        Object.assign(context, deepMerge(context, { devDependencies: { [dep]: `^${version}` } }));
                    }))
                );
                eslintSpinner.succeed('create eslint succeed');
                spinner.start();
            }

            // package.json
            const { createFileMap: createPackageJsonFileMap } = packagejson(context);
            const packageJsonFileMap = createPackageJsonFileMap(context);
            Object.keys(packageJsonFileMap).forEach(key => {
                const content = packageJsonFileMap[key]();
                fs.writeFileSync(TMP_DIR + key, content);
            });

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
