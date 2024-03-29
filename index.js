#!/usr/bin/env node
import { program } from "commander";
import { input, select, confirm } from "@inquirer/prompts";
import ora from "ora";
import fs from "fs-extra";
import path, { dirname } from "path";
import chalk from "chalk";
import deepMerge from "deepmerge";
import npmFetch from "npm-registry-fetch";
import pLimit from "p-limit";
import { cpus } from "os";
import ejs from "ejs";
import { fileURLToPath } from "url";
const viteTemplate = "import { defineConfig } from 'vite';\n<%_ if (env === 'node') { _%>\nimport { VitePluginNode } from 'vite-plugin-node';\n<%_ } _%>\nimport path from 'path';\nimport {fileURLToPath} from 'url';\nimport {dirname, resolve} from 'path';\nimport {IS_SERVER, conditionBack} from './build/config';\n<%_ if (frame === 'svelte') { _%>\nimport {svelte} from '@sveltejs/vite-plugin-svelte';\n<%_ } _%>\n<%_ if (['spa', 'ssr', 'component'].includes(mode)) { _%>\nimport purgecss from 'vite-plugin-purgecss-v2';\n<%_ } _%>\n\nconst CWD_PATH = process.cwd();\nconst resolveApp = (...paths) => path.resolve(CWD_PATH, ...paths);\n\nexport default defineConfig({\n    resolve: {\n        alias: [\n            {find: /^@\\/(.*)$/, replacement: path.resolve(__dirname, './src/$1')}\n        ]\n    },\n    build: {\n    <%_ if (mode === 'lib') { _%>\n        lib: {\n            entry: resolveApp('./index.js'),\n            formats: ['es'],\n            name: 'kit-cli',\n            fileName: '[name].js'\n        },\n    <%_ } _%>\n    <%_ if (mode === 'ssr') { _%>\n        ...conditionBack(IS_SERVER, {\n            lib: {\n                entry: 'src/entry-server.ts',\n            }\n        }),\n        outDir: IS_SERVER ? 'dist/server' : 'dist/client',\n    <%_ } _%>\n    },\n    plugins: [\n    <%_ if (['spa', 'ssr', 'component'].includes(mode)) { _%>\n        purgecss(),\n    <%_ } _%>\n    <%_ if (mode === 'server') { _%>\n        ...VitePluginNode({\n            appPath: resolveApp('./index.js'),\n        }),\n    <%_ } _%>\n    <%_ if (frame === 'svelte') { _%>\n        svelte()\n    <%_ } _%>\n    ]\n});\n";
const curDirname = () => dirname(fileURLToPath(import.meta.url));
const resolveApp = (...paths) => path.resolve(curDirname(), ...paths);
const CWD_DIR = process.cwd();
const resolveCWD = (...paths) => path.resolve(CWD_DIR, ...paths);
const conditionBack = (condition, value, value2) => {
  let res = {};
  if (value instanceof Array) {
    res = [];
  }
  return condition && value || value2 || res;
};
const recursiveChmod = async (directoryPath, mode) => {
  try {
    const files = await fs.readdir(directoryPath);
    for (const file of files) {
      const filePath = `${directoryPath}/${file}`;
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        await recursiveChmod(filePath, mode);
      }
      await fs.chmod(filePath, mode);
    }
  } catch (err) {
    console.error("Failed to recursively modify file permissions.");
    console.error(err);
  }
};
const vite = (context) => {
  return {
    name: "vite",
    createFileMap: () => {
      return {
        "/vite.config.js": () => ejs.render(viteTemplate, context)
      };
    },
    getDeps: () => [],
    getDevDeps: () => {
      return [
        "vite",
        ...conditionBack(
          ["spa", "ssr", "component"].includes(context.mode),
          ["vite-plugin-purgecss-v2"]
        ),
        ...conditionBack(
          context.frame === "svelte" && context.mode === "ssr",
          ["@sveltejs/vite-plugin-svelte"]
        ),
        ...conditionBack(context.cssPreprocessor === "less", ["less"], ["sass"]),
        ...conditionBack(context.env === "node", ["vite-plugin-node"])
      ].filter(Boolean);
    }
  };
};
const template = "const {resolve} = require('path');\nconst {IS_DEVELOPMENT, IS_PRODUCT} = require('./build/config');\n\nmodule.exports = {\n    presets: [\n        ['@babel/preset-env', {\n            targets: {\n                browsers: ['ie >= 8', 'iOS 7']\n            },\n            useBuiltIns: 'usage',\n            corejs: 3\n        }],\n    <%_ if (frame === 'react') { _%>\n        ['@babel/preset-react', {\n            runtime: 'automatic',\n            development: IS_DEVELOPMENT\n        }],\n    <%_ } _%>\n    <%_ if (language === 'typescript') { _%>\n        ['@babel/preset-typescript', {\n        }]\n    <%_ } _%>\n    ].filter(Boolean),\n    plugins: [\n    <%_ if (frame === 'react') { _%>\n        IS_DEVELOPMENT && \"react-refresh/babel\",\n    <%_ } _%>\n        // 'macros',\n        // ['import', {\n        //     libraryName: 'antd',\n        //     style: true,\n        //     libraryDirectory: 'lib'\n        // }, 'antd'],\n        ['import', {\n            libraryName: 'react-components',\n            style: name => `${name}/index.css`,\n            libraryDirectory: 'lib',\n        }, 'react-components'],\n    ].filter(Boolean)\n};";
const babel = (context) => {
  return {
    name: "babel",
    createFileMap: () => {
      return {
        "/.babelrc.js": () => {
          return ejs.render(template, context);
        }
      };
    },
    getDeps: () => ["@babel/core"],
    getDevDeps: () => {
      return [
        "babel",
        "@babel/preset-env",
        "babel-plugin-import",
        "babel-loader",
        ...context.language === "typescript" && [
          "@babel/preset-typescript"
        ] || [],
        ...context.frame === "react" && [
          "@babel/preset-react"
        ] || []
      ].filter(Boolean);
    }
  };
};
const webpackTemplate = "const path = require('path');\nconst webpack = require('webpack');\nconst HtmlWebpackPlugin = require('html-webpack-plugin');\nconst MiniCssExtractPlugin = require('mini-css-extract-plugin');\nconst CssMinimizerPlugin = require('css-minimizer-webpack-plugin');\nconst CopyPlugin = require('copy-webpack-plugin');\nconst ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');\nconst {MODE, ENTRY, OUTPUT, PUBLIC_PATH, DEVTOOL, SRC_PATH, IS_PRODUCT, IS_DEVELOPMENT, conditionBack} = require('./config.js');\n\n\nconst baseStyleLoaderConf = [\n    IS_PRODUCT\n        ? ({\n            loader: MiniCssExtractPlugin.loader,\n            options: {publicPath: '../'}\n        })\n        : 'style-loader',\n    {\n        loader: require.resolve('css-loader'),\n        options: {\n            modules: {\n                mode: 'local',\n                auto: /\\.module\\.\\w+$/i,\n                localIdentName: '[path][name]__[local]',\n                localIdentContext: SRC_PATH\n            }\n        }\n    },\n    'postcss-loader'\n];\n\n\n/** @type{import('webpack').Configuration}*/\nmodule.exports = {\n    mode: MODE,\n    entry: [ENTRY].filter(Boolean),\n    output: {\n        path: OUTPUT,\n        filename: 'js/[name]-[fullhash:8].bundle.js',\n        publicPath: PUBLIC_PATH\n    },\n    cache: IS_PRODUCT ? false : {\n        type: 'filesystem',\n        allowCollectingMemory: true\n    },\n    resolve: {\n        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', 'css', 'less', 'scss'],\n        alias: {\n            '@': SRC_PATH\n        },\n        modules: [SRC_PATH, 'node_modules']\n    },\n    devtool: DEVTOOL,\n    module: {\n        rules: [\n            {\n                test: /\\.[jt]sx?$/,\n                include: SRC_PATH,\n                exclude: /node_modules/,\n                use: [\n                    {\n                        loader: 'babel-loader',\n                        options: {\n                            cacheDirectory: true\n                        }\n                    }\n                    // IS_DEVELOPMENT && {\n                    //     loader: 'swc-loader',\n                    //     options: {\n                    //         parseMap: true,\n                    //         jsc: {\n                    //             parser: {\n                    //                 syntax: 'typescript',\n                    //                 tsx: true,\n                    //                 jsx: true,\n                    //                 dynamicImport: true\n                    //             },\n                    //             transform: {\n                    //                 react: {\n                    //                     runtime: 'automatic',\n                    //                     development: IS_DEVELOPMENT,\n                    //                     refresh: IS_DEVELOPMENT\n                    //                 }\n                    //             }\n                    //         }\n                    //     }\n                    // }\n                ]\n            },\n            {\n                test: /\\.scss$/,\n                exclude: /node_modules/,\n                use: [\n                    ...baseStyleLoaderConf,\n                    {\n                        loader: 'sass-loader'\n                    }\n                ]\n            },\n            {\n                test: /\\.less$/,\n                use: [\n                    ...baseStyleLoaderConf,\n                    {\n                        loader: 'less-loader'\n                    }\n                ]\n            },\n            {\n                test: /\\.css$/,\n                use: [\n                    ...baseStyleLoaderConf\n                ]\n            },\n            {\n                test: /\\.(woff|woff2|ttf|eot|svg|png|jpg|gif)(#.+)?$/,\n                type: 'asset',\n                generator: {\n                    filename: 'assets/[name].[hash:8][ext][query]'\n                },\n                parser: {\n                    dataUrlCondition: {\n                        maxSize: 8 * 1024\n                    }\n                }\n            }\n        ]\n    },\n    ...conditionBack(IS_DEVELOPMENT, {\n        devServer: {\n            port: PORT,\n            open: true,\n            hot: true,\n            compress: true,\n            client: {\n                overlay: false\n            },\n            proxy: {\n                '/api/': {\n                    target: 'http://localhost:3000',\n                    secure: false,\n                    changeOrigin: true,\n                    pathRewrite: {'^/api/': '/'}\n                }\n            }\n        }\n    }),\n    ...conditionBack(IS_PRODUCT, {\n        performance: {\n            hints: 'warning'\n        }\n    }),\n    optimization: {\n        runtimeChunk: true,\n        ...conditionBack(IS_DEVELOPMENT, {\n            removeEmptyChunks: false,\n            splitChunks: false,\n        }),\n        ...conditionBack(IS_PRODUCT, {\n            minimizer: [\n                // new TerserPlugin(),\n                new CssMinimizerPlugin({parallel: false})\n            ],\n            splitChunks: {\n                chunks: 'all',\n                minSize: 30 * 1024,\n                maxSize: 1024 * 1024,\n                minChunks: 1,\n                maxAsyncRequests: 26,\n                maxInitialRequests: 26,\n                cacheGroups: {\n                    initialVender: {\n                        priority: -6,\n                        chunks: 'initial',\n                        reuseExistingChunk: true,\n                        test: /[\\\\/]node_modules[\\\\/]/,\n                        name: 'initialVender',\n                        filename: 'js/[name].[fullhash:8].js'\n                    },\n                    vender: {\n                        priority: -7,\n                        chunks: 'all',\n                        reuseExistingChunk: true,\n                        test: /[\\\\/]node_modules[\\\\/]/,\n                        name: 'vender',\n                        filename: 'js/[name].[fullhash:8].js'\n                    }\n                }\n            }\n        })\n    },\n    plugins: [\n        new HtmlWebpackPlugin({\n            template: path.resolve(__dirname, '../index.ejs'),\n            templateParameters: {\n                title: 'react App',\n                baseUrl: IS_PRODUCT ? './' : '/'\n            }\n        }),\n        new webpack.ProvidePlugin({\n            // React: 'react'\n        }),\n        new webpack.DefinePlugin({\n            process: JSON.stringify({\n                env: {\n                    NODE_ENV: process.env.NODE_ENV,\n                    ASSET_PATH: PUBLIC_PATH\n                }\n            })\n        })\n    ].concat(\n        conditionBack(IS_DEVELOPMENT, [\n            new ReactRefreshWebpackPlugin({overlay: false})\n        ])\n    ).concat(\n        conditionBack(IS_PRODUCT, [\n            new MiniCssExtractPlugin({\n                filename: 'assets/[name].[hash:8].css'\n            }),\n            // new CompressionPlugin(),\n            new CopyPlugin({\n                patterns: [\n                    {\n                        from: path.resolve(__dirname, '../public'),\n                        to: path.resolve(__dirname, '../dist')\n                    }\n                ]\n            })\n        ])\n    )\n};\n";
const webpackAnalyzeTemplate = "const {merge} = require('webpack-merge');\nconst webpackConfig = require('./webpack.config');\nconst BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;\n\n/** @type{import('webpack').Configuration}*/\nmodule.exports = merge(webpackConfig, {\n    plugins: [\n        new BundleAnalyzerPlugin()\n    ]\n});\n";
const webpack = (context) => {
  return {
    name: "webpack",
    createFileMap: () => {
      return {
        "/build/webpack.config.js": () => ejs.render(webpackTemplate, context),
        "/build/webpack.analyze.js": () => ejs.render(webpackAnalyzeTemplate, context)
      };
    },
    getDeps: () => [],
    getDevDeps: () => {
      return [
        "webpack",
        "webpack-cli",
        "webpack-dev-server",
        "copy-webpack-plugin",
        "html-webpack-plugin",
        "add-asset-html-webpack-plugin",
        "webpack-bundle-analyzer",
        "babel-loader",
        "css-loader",
        "style-loader",
        "postcss-loader",
        ...conditionBack(context.cssPreprocessor === "less", ["less", "less-loader"])
      ].filter(Boolean);
    }
  };
};
const eslintignoreTemplate = "node_modules\n\ndist\ndll\nlib\n\ncoverage\n\npublic\n";
const eslintrcTemplate = "module.exports = {\n    root: true,\n    env: {\n        browser: true,\n        es2021: true,\n        node: true,\n        jest: true\n    },\n    extends: ['eslint:recommended'],\n    overrides: [\n    <%_ if (language === 'typescript') { _%>\n        {\n            files: ['*.ts', '*.tsx'],\n            extends: ['plugin:@typescript-eslint/recommended'],\n            parser: '@typescript-eslint/parser',\n            plugins: ['@typescript-eslint'],\n            rules: {\n                '@typescript-eslint/no-var-requires': [0],\n                '@typescript-eslint/no-namespace': [0],\n                '@typescript-eslint/no-empty-function': [1],\n                '@typescript-eslint/no-explicit-any': [1],\n                '@typescript-eslint/ban-types': [1]\n            }\n        },\n    <%_ } _%>\n    <%_ if (frame === 'react') { _%>\n        {\n            files: ['*.jsx', '*.tsx'],\n            extends: ['plugin:react/recommended', 'plugin:react/jsx-runtime', 'plugin:react-hooks/recommended'],\n            rules: {\n                'react/no-unknown-property': ['error', {ignore: ['styleName']}],\n                'react/prop-types': [0],\n                'react/display-name': [0],\n                'react/self-closing-comp': ['error', {component: true, html: true}], // 自闭合\n                'react/jsx-props-no-multi-spaces': ['error']\n            }\n        },\n    <%_ } else if (frame === 'vue') { _%>\n        {\n            files: ['*.vue'],\n            extends: ['plugin:vue/vue3-recommended'],\n            parser: 'vue-eslint-parser',\n            parserOptions: {parser: '@typescript-eslint/parser'},\n            rules: {'vue/html-indent': [2, 4]}\n        }\n    <%_ } _%>\n    ],\n    parserOptions: {\n        ecmaVersion: 'latest',\n        sourceType: 'module'\n    },\n    plugins: ['simple-import-sort'],\n    rules: {\n        'max-len': ['error', {code: 120}], // 允许一行最大的长度\n\n        // 缩进\n        indent: [2, 4],\n\n        // 引号\n        quotes: [2, 'single'],\n\n        'arrow-parens': ['error', 'as-needed'], // 剪头函数一个参数时不需要圆括号\n\n        // 对象属性引号\n        'quote-props': [2, 'as-needed'],\n\n        // 对象最后一项不加,\n        'comma-dangle': [2, 'never'],\n\n        // 末尾加;\n        semi: ['error', 'always'],\n\n        // 行不允许空格\n        'no-trailing-spaces': [2],\n\n        // 大括号空格\n        'object-curly-spacing': [2, 'never'],\n\n        'object-curly-newline': [2,  {consistent: true}], // 对象头尾是否换行\n\n        'object-property-newline': [2, {allowAllPropertiesOnSameLine: true}], // 对象属性是否折行，动态适应\n\n        'key-spacing': ['error', {afterColon: true}], // 冒号后留空格\n\n        'comma-spacing': ['error', {after: true}], // 逗号后留空格\n\n        // 文件结尾空行\n        'eol-last': [2, 'always'],\n\n        // 空行的数量\n        'no-multiple-empty-lines': [2, {max: 2, maxEOF: 1}],\n\n        'no-case-declarations': [0],\n\n        'keyword-spacing': [2],\n\n        'no-shadow': [2], // 重复定义\n\n        'no-redeclare': [2],\n\n        'no-empty': [2, {allowEmptyCatch: true}],\n\n        'no-unused-vars': [2],\n\n        // 针对import排序\n        'simple-import-sort/imports': [1, {\n            groups: [['^node:', '^[a-zA-Z]', '^@[a-zA-Z]', '^@\\\\/', '^\\\\/', '^\\\\.', '^\\\\u0000']]\n        }],\n\n        'simple-import-sort/exports': [1]\n    }\n};\n";
const eslint = (context) => {
  return {
    name: "eslint",
    createFileMap: () => {
      return {
        "/.eslintrc.cjs": () => ejs.render(eslintrcTemplate, context),
        "/.eslintignore": () => eslintignoreTemplate
      };
    },
    getDeps: () => [],
    getDevDeps: () => {
      return [
        "eslint",
        "@babel/eslint-parser",
        "eslint-plugin-simple-import-sort",
        ...context.language === "typescript" && [
          "@typescript-eslint/eslint-plugin",
          "@typescript-eslint/parser"
        ] || [],
        ...context.frame === "react" && [
          "eslint-plugin-react",
          "eslint-plugin-react-hooks"
        ] || [],
        ...context.frame === "vue" && [
          "eslint-plugin-vue"
        ] || []
      ].filter(Boolean);
    }
  };
};
const jsTemplate = '{\n    "compilerOptions": {\n        "baseUrl": ".",\n        "paths": {\n            "@/*": ["src/*"]\n        }\n    },\n    "include": ["src"],\n    "exclude": ["node_modules"]\n}';
const tsTemplate = `{ 
<%_ if (frame === 'svelte') { _%>
    "extends": "@tsconfig/svelte/tsconfig.json",
<%_ } _%>
    "compilerOptions": {
        "baseUrl": ".",
        "outDir": ".",
        "target": "esnext",
        "module": "esnext",
        "moduleResolution": "node",
    <%_ if (frame === 'react') { _%>
        "jsx": "react",
        "jsxFactory": "h",
        "jsxFragmentFactory": "Fragment",
    <%_ } _%>
        "noEmit": true,
        "noEmitOnError": true,
        "noImplicitThis": true,
        "noFallthroughCasesInSwitch": true,
        "importHelpers": true,
        "strict": true,
        "isolatedModules": true,
        "resolveJsonModule": true,
        "esModuleInterop": true,
        "allowSyntheticDefaultImports": true,
        "allowJs": true,
        "allowUnreachableCode": true,
        "skipLibCheck": true,
    <%_ if (useCssModule) { _%>
        "forceConsistentCasingInFileNames": true,
        "plugins": [
            {"name": "typescript-plugin-css-modules"}
        ],
    <%_ } _%>
        "lib": [
            "dom",
            "dom.iterable",
            "esnext"
        ],
        "paths": {
            "@/*": ["src/*"]
        }
    },
    "include": ["src", "__tests__"],
    "exclude": ["node_modules", "dist", "lib"]
}`;
const javascript = (context) => {
  return {
    name: "javascript/typescript",
    createFileMap: () => {
      return {
        "/jsconfig.json": () => {
          return ejs.render(jsTemplate, context);
        },
        ...context.language === "typescript" && {
          "/tsconfig.json": () => ejs.render(tsTemplate, context)
        } || {}
      };
    },
    getDeps: () => [],
    getDevDeps: () => {
      return [
        ...conditionBack(context.language === "typescript", ["typescript", "tslib"]),
        ...conditionBack(context.frame === "svelte", ["@tsconfig/svelte"]),
        ...conditionBack(context.useCssModule, ["typescript-plugin-css-modules"])
      ].filter(Boolean);
    }
  };
};
const packageTemplate = `{
    "name": "<%= name %>",
    "private": true,
    "version": "0.0.0",
    "main": "./index.js",
    "type": "module",
    "files": [
        "dist"
    ],
    "scripts": {
    <%_ if (complier === 'webpack') { _%>
        "dev": "cross-env NODE_ENV=development webpack-dev-server --config build/webpack.config.js",
        "build": "rimraf dist && cross-env NODE_ENV=production webpack --config build/webpack.config.js --progress",
        "analyze": "rimraf dist && cross-env NODE_ENV=production webpack --config build/webpack.analyze.js --progress",
        "test": "jest"
    <%_ } _%>
    <%_ if (mode === 'lib') { _%>
        "dev": "vite build --watch",
        "build": "vite build"
    <%_ } _%>
    <%_ if (mode === 'ssr') { _%>
        "dev": "node server",
        "build": "npm run build:client && npm run build:server",
        "build:client": "cross-env MODE_ENV=client vite build --ssrManifest",
        "build:server": "cross-env MODE_ENV=server vite build --ssr",
        "preview": "cross-env NODE_ENV=production MODE_ENV=server node server"
    <%_ } _%>
    },
    "dependencies": {
    <%_ Object.entries(dependencies).forEach(([key, value], i, array) => { _%>
        "<%= key %>": "<%= value %>"<%- i !== array.length - 1 ? ',' : '' %>
    <%_ }) _%>
    },
    "devDependencies": {
    <%_ Object.entries(devDependencies).forEach(([key, value], i, array) => { _%>
        "<%= key %>": "<%= value %>"<%- i !== array.length - 1 ? ',' : '' %>
    <%_ }) _%>
    }
}
`;
const packagejson = (context) => {
  return {
    name: "package.json",
    createFileMap: () => {
      return {
        "/package.json": () => ejs.render(packageTemplate, context)
      };
    }
  };
};
const droneTemplate = "kind: pipeline\ntype: exec\nname: app-name\n\nplatform:\n  os: linux\n  arch: amd64\n\nsteps:\n  - name: build\n    commands:\n      - chmod +x ./script/build.sh\n      - ./script/build.sh clean\n      - ./script/build.sh buildImage\n      - ./script/build.sh startImage\n";
const buildTemplate = '#!/bin/bash\n\nIMAGE_NAME="app-name:1.0"\nCONTAINER_NAME="my-app-name"\n\nclean() {\n    if [[ "$(docker images -q $IMAGE_NAME 2> /dev/null)" != "" ]]; then\n        echo "$IMAGE_NAME exist, and deleting $IMAGE_NAME"\n        # 如果存在同名镜像，检查是否有同名的容器在运行\n        if [[ "$(docker ps -aq -f name=$CONTAINER_NAME 2> /dev/null)" != "" ]]; then\n            # 如果有同名容器在运行，停止并删除容器\n            echo "$CONTAINER_NAME exist, and deleting $CONTAINER_NAME"\n            docker stop $CONTAINER_NAME\n            docker rm $CONTAINER_NAME\n        fi\n        # 删除同名镜像\n        docker rmi $IMAGE_NAME\n    fi\n    # 删除悬空镜像\n    if [[ "$(docker images -f "dangling=true" -q 2> /dev/null)" != "" ]]; then\n        echo "cleaning dangling images"\n        docker rmi $(docker images -f "dangling=true" -q) 2> /dev/null\n    fi\n}\n\nbuildImage() {\n    echo "staring build $IMAGE_NAME image"\n    docker build -t $IMAGE_NAME .\n}\n\nstartImage() {\n    echo "staring build image $IMAGE_NAME"\n    docker run \\\n        -d \\\n        --restart=always \\\n        --name $CONTAINER_NAME \\\n        -u root \\\n        -p 3000:3000 \\\n        --restart=always \\\n        $IMAGE_NAME\n}\n\nmain() {\n    action="$1"\n    echo "$action"\n\n    if [ "$action" = "clean" ]; then\n        clean\n    elif [ "$action" = "buildImage" ]; then\n        buildImage\n    elif [ "$action" = "startImage" ]; then\n        startImage\n    fi\n}\n\nmain "$@"\n';
const DockerfileTemplate = '# build stage\nFROM node:18-alpine as build-stage\nRUN node -v \\\n    && npm -v \\\n    && npm config set registry https://registry.npm.taobao.org/ \\\n    && npm config get registry\nWORKDIR /app\nCOPY package*.json ./\nCOPY *-lock.json ./\nRUN npm config get registry \\\n    && npm install\nCOPY . .\nRUN npm run build\nEXPOSE 3000\nCMD [ "npm", "run", "start"]';
const JenkinsfileTemplate = `pipeline {
  agent any

  stages {
    stage('拉取远程代码') {
      steps {
        echo "拉取远程代码"
        // 参考jenkins流水线语法
      }
    }

    stage('清理环境') {
      steps {
        sh 'chmod +x script/build.sh'
        sh "script/build.sh clean"
      }
    }

    stage('提供基础环境') {
      steps {
        sh "script/build.sh buildBaseEnv"
      }
    }

    stage('构建镜像') {
      steps {
        sh "script/build.sh buildImage"
      }
    }

    stage('启动镜像') {
      steps {
        input message: '确认发布', ok: '发布'

        sh "script/build.sh startImage"
      }
    }
  }
}`;
const docker = (context) => {
  return {
    name: "CI-CD",
    createFileMap: () => {
      return {
        "/script/build.sh": () => buildTemplate,
        "/.drone.yml": () => droneTemplate,
        "/Dockerfile": () => DockerfileTemplate,
        "/Jenkinsfile": () => JenkinsfileTemplate
      };
    },
    getDeps: () => [],
    getDevDeps: () => []
  };
};
const postcssTemplate = "module.exports = {\n    plugins: [\n        require('tailwindcss'),\n        require('autoprefixer'),\n        require('postcss-pxtorem')({\n            rootValue: 16, // 指定转换倍率，我现在设置这个表示1rem=16px;\n            propList: ['*'] // 属性列表，表示你要把哪些css属性的px转换成rem，这个*表示所有\n            // minPixelValue: 1, // 需要转换的最小值，一般1px像素不转换，以上才转换\n            // unitPrecision: 6, // 转换成rem单位的小数点后的保留位数\n            // selectorBalckList: ['van'], // 匹配不被转换为rem的选择器\n            // replace: true, // 替换包含rem的规则，而不是添加回退\n            // mediaQuery: false // 允许在媒体查询中转换px\n        })\n    ]\n};\n";
const tailwindTemplate = `/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["src/**/*.{html,js,svelte,tsx,jsx,vue}"],
    theme: {
        extend: {},
    },
    plugins: [],
};`;
const css = (context) => {
  return {
    name: "css",
    createFileMap: () => {
      return {
        "/postcss.config.cjs": () => postcssTemplate,
        "/tailwind.config.js": () => tailwindTemplate
      };
    },
    getDeps: () => [
      ...conditionBack(
        ["spa", "ssr", "component"].includes(context.mode),
        ["tailwindcss"]
      )
    ],
    getDevDeps: () => [
      ...conditionBack(
        ["spa", "ssr", "component"].includes(context.mode),
        [
          "postcss",
          "postcss-pxtorem",
          "autoprefixer"
        ]
      )
    ]
  };
};
const templateMap = {
  vite,
  webpack,
  babel,
  eslint,
  javascript,
  packagejson,
  docker,
  css
};
const sourceCode = (context) => {
  return {
    getCodePath: () => {
      const { frame, mode } = context;
      return `${frame}-${mode}`;
    }
  };
};
const limit = pLimit(cpus().length - 1);
program.command("create").argument("[appName]", "appName").description("create app").action(async (appName) => {
  try {
    const context = {};
    let name = appName || "";
    !name && (name = await input({ message: "请输入应用名称", default: "my-app" }));
    const mode = await select({
      message: "请选择项目的类型",
      choices: [{ value: "spa" }, { value: "ssr" }, { value: "lib" }, { value: "server" }, { value: "component" }],
      default: "spa"
    });
    let env = "web";
    if (["lib"].includes(mode)) {
      env = await select({ message: "请选择运行的环境", choices: [{ value: "web" }, { value: "node" }], default: "web" });
    }
    let frame = "none";
    if (mode !== "lib") {
      frame = await select({
        message: "请选择使用的框架",
        choices: (() => {
          if (mode === "server") {
            return [{ value: "express" }, { value: "koa" }, { value: "none" }];
          }
          return [{ value: "react" }, { value: "vue" }, { value: "svelte" }, { value: "none" }];
        })(),
        default: "react"
      });
    }
    const language = await select({
      message: "请选择要使用的语言",
      choices: [{ value: "javascript" }, { value: "typescript" }],
      default: "javascript"
    });
    let [cssPreprocessor, useCssModule] = ["none", false];
    if (!["lib", "server"].includes(mode)) {
      cssPreprocessor = await select({
        message: "请选择要使用的css预处理器",
        choices: [{ value: "less" }, { value: "scss" }, { value: "none" }],
        default: "less"
      });
      if (!["vue", "svelte"].includes(frame)) {
        useCssModule = await confirm({ message: "是否开启css module", default: true });
      }
    }
    const useEslint = await confirm({ message: "是否使用eslint", default: true });
    let complier = "webpack";
    if (["ssr", "lib"].includes(mode)) {
      complier = "vite";
    }
    Object.assign(context, {
      name,
      language,
      frame,
      mode,
      useEslint,
      useCssModule,
      cssPreprocessor,
      complier,
      env
    });
    const spinner = ora("initializing").start();
    const WORKSPACE_DIR = resolveCWD(`./${name}`);
    const basePath = resolveApp("./template/base");
    await recursiveChmod(basePath, 511);
    fs.cpSync(basePath, WORKSPACE_DIR, { recursive: true });
    const TASK_QUEUE = [
      ...conditionBack(complier === "webpack", [
        templateMap.babel,
        templateMap.webpack
      ], [templateMap.vite]),
      templateMap.eslint,
      templateMap.javascript,
      templateMap.docker,
      templateMap.css
    ];
    const dependencies = /* @__PURE__ */ new Set([
      ...conditionBack(frame === "react", ["react", "react-dom"]),
      ...conditionBack(frame === "vue", ["vue", "vue-router"]),
      ...conditionBack(frame === "svelte", ["svelte"]),
      ...conditionBack(mode === "ssr", ["express", "compression", "sirv"])
    ]);
    const devDependencies = /* @__PURE__ */ new Set([
      "rimraf",
      "cross-env",
      ...conditionBack(["lib", "ssr"].includes(mode), ["wait-on", "concurrently"])
    ]);
    await Promise.all(
      TASK_QUEUE.map((func) => limit(async () => {
        const fn = () => {
        };
        const { createFileMap = fn, getDeps = fn, getDevDeps = fn } = func(context) || {};
        const fileMap = await createFileMap() || {};
        const devDeps = await getDevDeps() || [];
        const deps = await getDeps() || [];
        Object.entries(fileMap).forEach(([filePath, getContent]) => {
          fs.writeFileSync(WORKSPACE_DIR + filePath, getContent() || "");
        });
        deps.forEach((dep) => dependencies.add(dep));
        devDeps.forEach((devDep) => devDependencies.add(devDep));
      }))
    );
    await Promise.all(
      [...dependencies].map((dep) => limit(async () => {
        const { version } = await npmFetch.json(`/${dep}/latest`);
        Object.assign(context, deepMerge(context, { dependencies: { [dep]: `^${version}` } }));
      }))
    );
    await Promise.all(
      [...devDependencies].map((dep) => limit(async () => {
        const { version } = await npmFetch.json(`/${dep}/latest`);
        Object.assign(context, deepMerge(context, { devDependencies: { [dep]: `^${version}` } }));
      }))
    );
    try {
      const { createFileMap } = templateMap.packagejson(context);
      Object.entries(await createFileMap()).forEach(([filePath, getContent]) => {
        fs.writeFileSync(WORKSPACE_DIR + filePath, getContent() || "");
      });
    } catch (err) {
      throw new Error(err);
    }
    const { getCodePath } = sourceCode(context);
    const codePath = resolveApp("./template/code", getCodePath());
    await recursiveChmod(codePath, 511);
    fs.cpSync(codePath, WORKSPACE_DIR, { recursive: true });
    await recursiveChmod(WORKSPACE_DIR, 511);
    spinner.succeed("create project succeed");
    console.log(chalk.green(
      [
        "",
        chalk.white("🚀 done, exec:"),
        `   cd ${appName}`,
        "   npm install",
        "   npm run dev"
      ].join("\n")
    ));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});
program.parse();
