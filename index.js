#!/usr/bin/env node
import { program } from "commander";
import { input, select, confirm } from "@inquirer/prompts";
import ora from "ora";
import fs from "fs";
import path, { dirname } from "path";
import chalk from "chalk";
import deepMerge from "deepmerge";
import npmFetch from "npm-registry-fetch";
import pLimit from "p-limit";
import { cpus } from "os";
import ejs from "ejs";
import { fileURLToPath } from "url";
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
    <%_ } else if (true) { _%>
        "dev": "vite",
        "build": "vite build --watch"
    <%_ } _%>
    },
    "dependencies": {<% Object.entries(dependencies).forEach(([key, value], i, array) => { %>
        "<%= key %>": "<%= value %>"<%- i !== array.length - 1 ? ',' : '' _%>
    <%_ }) %>
    },
    "devDependencies": {<% Object.entries(devDependencies).forEach(([key, value], i, array) => { %>
        "<%= key %>": "<%= value %>"<%- i !== array.length - 1 ? ',' : '' _%>
    <%_ }) %>
    }
}
`;
const packagejson = (context) => {
  return {
    createFileMap: () => {
      return {
        "/package.json": () => ejs.render(packageTemplate, context)
      };
    }
  };
};
const eslintignoreTemplate = "node_modules\n\ndist\ndll\nlib\n\ncoverage\n\npublic\n";
const eslintrcTemplate = "module.exports = {\n    root: true,\n    env: {\n        browser: true,\n        es2021: true,\n        node: true,\n        jest: true\n    },\n    extends: ['eslint:recommended'],\n    overrides: [\n    <%_ if (language === 'typescript') { _%>\n        {\n            files: ['*.ts', '*.tsx'],\n            extends: ['plugin:@typescript-eslint/recommended'],\n            parser: '@typescript-eslint/parser',\n            plugins: ['@typescript-eslint'],\n            rules: {\n                '@typescript-eslint/no-var-requires': [0],\n                '@typescript-eslint/no-namespace': [0],\n                '@typescript-eslint/no-empty-function': [1],\n                '@typescript-eslint/no-explicit-any': [1],\n                '@typescript-eslint/ban-types': [1]\n            }\n        },\n    <%_ } _%>\n    <%_ if (frame === 'react') { _%>\n        {\n            files: ['*.jsx', '*.tsx'],\n            extends: ['plugin:react/recommended', 'plugin:react/jsx-runtime', 'plugin:react-hooks/recommended'],\n            rules: {\n                'react/no-unknown-property': ['error', {ignore: ['styleName']}],\n                'react/prop-types': [0],\n                'react/display-name': [0],\n                'react/self-closing-comp': ['error', {component: true, html: true}], // 自闭合\n                'react/jsx-props-no-multi-spaces': ['error']\n            }\n        },\n    <%_ } else if (frame === 'vue') { _%>\n        {\n            files: ['*.vue'],\n            extends: ['plugin:vue/vue3-recommended'],\n            parser: 'vue-eslint-parser',\n            parserOptions: {parser: '@typescript-eslint/parser'},\n            rules: {'vue/html-indent': [2, 4]}\n        }\n    <%_ } _%>\n    ],\n    parserOptions: {\n        ecmaVersion: 'latest',\n        sourceType: 'module'\n    },\n    plugins: ['simple-import-sort'],\n    rules: {\n        'max-len': ['error', {code: 120}], // 允许一行最大的长度\n\n        // 缩进\n        indent: [2, 4],\n\n        // 引号\n        quotes: [2, 'single'],\n\n        'arrow-parens': ['error', 'as-needed'], // 剪头函数一个参数时不需要圆括号\n\n        // 对象属性引号\n        'quote-props': [2, 'as-needed'],\n\n        // 对象最后一项不加,\n        'comma-dangle': [2, 'never'],\n\n        // 末尾加;\n        semi: ['error', 'always'],\n\n        // 行不允许空格\n        'no-trailing-spaces': [2],\n\n        // 大括号空格\n        'object-curly-spacing': [2, 'never'],\n\n        'object-curly-newline': [2,  {consistent: true}], // 对象头尾是否换行\n\n        'object-property-newline': [2, {allowAllPropertiesOnSameLine: true}], // 对象属性是否折行，动态适应\n\n        'key-spacing': ['error', {afterColon: true}], // 冒号后留空格\n\n        'comma-spacing': ['error', {after: true}], // 逗号后留空格\n\n        // 文件结尾空行\n        'eol-last': [2, 'always'],\n\n        // 空行的数量\n        'no-multiple-empty-lines': [2, {max: 2, maxEOF: 1}],\n\n        'no-case-declarations': [0],\n\n        'keyword-spacing': [2],\n\n        'no-shadow': [2], // 重复定义\n\n        'no-redeclare': [2],\n\n        'no-empty': [2, {allowEmptyCatch: true}],\n\n        'no-unused-vars': [2],\n\n        // 针对import排序\n        'simple-import-sort/imports': [1, {\n            groups: [['^node:', '^[a-zA-Z]', '^@[a-zA-Z]', '^@\\\\/', '^\\\\/', '^\\\\.', '^\\\\u0000']]\n        }],\n\n        'simple-import-sort/exports': [1]\n    }\n};\n";
const eslint = (context) => {
  return {
    createFileMap: () => {
      return {
        "/.eslintrc.js": () => ejs.render(eslintrcTemplate, context),
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
    createFileMap: () => {
      return {
        "/jsconfig.json": () => {
          return ejs.render(jsTemplate, context);
        },
        "/tsconfig.json": () => {
          return ejs.render(tsTemplate, context);
        }
      };
    },
    getDeps: () => [],
    getDevDeps: () => {
      return [
        "typescript",
        ...context.useCssModule && [
          "typescript-plugin-css-modules"
        ] || []
      ].filter(Boolean);
    }
  };
};
const template = "const {resolve} = require('path');\nconst {IS_DEVELOPMENT, IS_PRODUCT} = require('./build/config');\n\nmodule.exports = {\n    presets: [\n        ['@babel/preset-env', {\n            targets: {\n                browsers: ['ie >= 8', 'iOS 7']\n            },\n            useBuiltIns: 'usage',\n            corejs: 3\n        }],\n    <%_ if (frame === 'react') { _%>\n        ['@babel/preset-react', {\n            runtime: 'automatic',\n            development: IS_DEVELOPMENT\n        }],\n    <%_ } _%>\n    <%_ if (language === 'typescript') { _%>\n        ['@babel/preset-typescript', {\n        }]\n    <%_ } _%>\n    ].filter(Boolean),\n    plugins: [\n    <%_ if (frame === 'react') { _%>\n        IS_DEVELOPMENT && \"react-refresh/babel\",\n    <%_ } _%>\n        // 'macros',\n        // ['import', {\n        //     libraryName: 'antd',\n        //     style: true,\n        //     libraryDirectory: 'lib'\n        // }, 'antd'],\n        ['import', {\n            libraryName: 'react-components',\n            style: name => `${name}/index.css`,\n            libraryDirectory: 'lib',\n        }, 'react-components'],\n    ].filter(Boolean)\n};";
const babel = (context) => {
  return {
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
const webpackTemplate = "const path = require('path');\nconst webpack = require('webpack');\nconst HtmlWebpackPlugin = require('html-webpack-plugin');\nconst MiniCssExtractPlugin = require('mini-css-extract-plugin');\nconst CssMinimizerPlugin = require('css-minimizer-webpack-plugin');\nconst CopyPlugin = require('copy-webpack-plugin');\nconst ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');\nconst {MODE, ENTRY, OUTPUT, PUBLIC_PATH, DEVTOOL, SRC_PATH, IS_PRODUCT, IS_DEVELOPMENT} = require('./config.js');\n\n\nconst conditionBack = (condition, value) => {\n    const res = {};\n    if (value instanceof Array) {\n        res = [];\n    }\n    return condition && value || res;\n};\n\nconst baseStyleLoaderConf = [\n    IS_PRODUCT\n        ? ({\n            loader: MiniCssExtractPlugin.loader,\n            options: {publicPath: '../'}\n        })\n        : 'style-loader',\n    {\n        loader: require.resolve('css-loader'),\n        options: {\n            modules: {\n                mode: 'local',\n                auto: /\\.module\\.\\w+$/i,\n                localIdentName: '[path][name]__[local]',\n                localIdentContext: SRC_PATH\n            }\n        }\n    },\n    'postcss-loader'\n];\n\n\n/** @type{import('webpack').Configuration}*/\nmodule.exports = {\n    mode: MODE,\n    entry: [ENTRY].filter(Boolean),\n    output: {\n        path: OUTPUT,\n        filename: 'js/[name]-[fullhash:8].bundle.js',\n        publicPath: PUBLIC_PATH\n    },\n    cache: IS_PRODUCT ? false : {\n        type: 'filesystem',\n        allowCollectingMemory: true\n    },\n    resolve: {\n        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', 'css', 'less', 'scss'],\n        alias: {\n            '@': SRC_PATH\n        },\n        modules: [SRC_PATH, 'node_modules']\n    },\n    devtool: DEVTOOL,\n    module: {\n        rules: [\n            {\n                test: /\\.[jt]sx?$/,\n                include: SRC_PATH,\n                exclude: /node_modules/,\n                use: [\n                    {\n                        loader: 'babel-loader',\n                        options: {\n                            cacheDirectory: true\n                        }\n                    }\n                    // IS_DEVELOPMENT && {\n                    //     loader: 'swc-loader',\n                    //     options: {\n                    //         parseMap: true,\n                    //         jsc: {\n                    //             parser: {\n                    //                 syntax: 'typescript',\n                    //                 tsx: true,\n                    //                 jsx: true,\n                    //                 dynamicImport: true\n                    //             },\n                    //             transform: {\n                    //                 react: {\n                    //                     runtime: 'automatic',\n                    //                     development: IS_DEVELOPMENT,\n                    //                     refresh: IS_DEVELOPMENT\n                    //                 }\n                    //             }\n                    //         }\n                    //     }\n                    // }\n                ]\n            },\n            {\n                test: /\\.scss$/,\n                exclude: /node_modules/,\n                use: [\n                    ...baseStyleLoaderConf,\n                    {\n                        loader: 'sass-loader'\n                    }\n                ]\n            },\n            {\n                test: /\\.less$/,\n                use: [\n                    ...baseStyleLoaderConf,\n                    {\n                        loader: 'less-loader'\n                    }\n                ]\n            },\n            {\n                test: /\\.css$/,\n                use: [\n                    ...baseStyleLoaderConf\n                ]\n            },\n            {\n                test: /\\.(woff|woff2|ttf|eot|svg|png|jpg|gif)(#.+)?$/,\n                type: 'asset',\n                generator: {\n                    filename: 'assets/[name].[hash:8][ext][query]'\n                },\n                parser: {\n                    dataUrlCondition: {\n                        maxSize: 8 * 1024\n                    }\n                }\n            }\n        ]\n    },\n    ...conditionBack(IS_DEVELOPMENT, {\n        devServer: {\n            port: PORT,\n            open: true,\n            hot: true,\n            compress: true,\n            client: {\n                overlay: false\n            },\n            proxy: {\n                '/api/': {\n                    target: 'http://localhost:3000',\n                    secure: false,\n                    changeOrigin: true,\n                    pathRewrite: {'^/api/': '/'}\n                }\n            }\n        }\n    }),\n    ...conditionBack(IS_PRODUCT, {\n        performance: {\n            hints: 'warning'\n        }\n    }),\n    optimization: {\n        runtimeChunk: true,\n        ...conditionBack(IS_DEVELOPMENT, {\n            removeEmptyChunks: false,\n            splitChunks: false,\n        }),\n        ...conditionBack(IS_PRODUCT, {\n            minimizer: [\n                // new TerserPlugin(),\n                new CssMinimizerPlugin({parallel: false})\n            ],\n            splitChunks: {\n                chunks: 'all',\n                minSize: 30 * 1024,\n                maxSize: 1024 * 1024,\n                minChunks: 1,\n                maxAsyncRequests: 26,\n                maxInitialRequests: 26,\n                cacheGroups: {\n                    initialVender: {\n                        priority: -6,\n                        chunks: 'initial',\n                        reuseExistingChunk: true,\n                        test: /[\\\\/]node_modules[\\\\/]/,\n                        name: 'initialVender',\n                        filename: 'js/[name].[fullhash:8].js'\n                    },\n                    vender: {\n                        priority: -7,\n                        chunks: 'all',\n                        reuseExistingChunk: true,\n                        test: /[\\\\/]node_modules[\\\\/]/,\n                        name: 'vender',\n                        filename: 'js/[name].[fullhash:8].js'\n                    }\n                }\n            }\n        })\n    },\n    plugins: [\n        new HtmlWebpackPlugin({\n            template: path.resolve(__dirname, '../index.ejs'),\n            templateParameters: {\n                title: 'react App',\n                baseUrl: IS_PRODUCT ? './' : '/'\n            }\n        }),\n        new webpack.ProvidePlugin({\n            // React: 'react'\n        }),\n        new webpack.DefinePlugin({\n            process: JSON.stringify({\n                env: {\n                    NODE_ENV: process.env.NODE_ENV,\n                    ASSET_PATH: PUBLIC_PATH\n                }\n            })\n        })\n    ].concat(\n        conditionBack(IS_DEVELOPMENT, [\n            new ReactRefreshWebpackPlugin({overlay: false})\n        ])\n    ).concat(\n        conditionBack(IS_PRODUCT, [\n            new MiniCssExtractPlugin({\n                filename: 'assets/[name].[hash:8].css'\n            }),\n            // new CompressionPlugin(),\n            new CopyPlugin({\n                patterns: [\n                    {\n                        from: path.resolve(__dirname, '../public'),\n                        to: path.resolve(__dirname, '../dist')\n                    }\n                ]\n            })\n        ])\n    )\n};\n";
const webpackAnalyzeTemplate = "const {merge} = require('webpack-merge');\nconst webpackConfigProd = require('./webpack.prod');\nconst BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;\n\n/** @type{import('webpack').Configuration}*/\nmodule.exports = merge(webpackConfigProd, {\n    plugins: [\n        new BundleAnalyzerPlugin()\n    ]\n});\n";
const webpack = (context) => {
  return {
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
        "less-loader",
        "css-loader",
        "style-loader",
        "postcss-loader"
      ].filter(Boolean);
    }
  };
};
const curDirname = () => dirname(fileURLToPath(import.meta.url));
const resolveApp = (...paths) => path.resolve(curDirname(), ...paths);
process.cwd();
const limit = pLimit(cpus().length - 1);
program.command("create").argument("[appName]", "appName").description("create app").action(async (appName) => {
  try {
    const context = {};
    let name = appName || "";
    !name && (name = await input({ message: "请输入应用名称", default: "my-app" }));
    const env = await select({ message: "请选择运行的环境", choices: [{ value: "web" }, { value: "node" }], default: "web" });
    const mode = await select({
      message: "请选择项目的类型",
      choices: (() => {
        const HANDLE_MAP = {
          web: () => [{ value: "spa" }, { value: "lib" }],
          node: () => [{ value: "lib" }, { value: "ssr" }, { value: "server" }]
        };
        return HANDLE_MAP[env]();
      })(),
      default: "lib"
    });
    const frame = await select({
      message: "请选择使用的框架",
      choices: (() => {
        if (mode === "server") {
          return [{ value: "express" }, { value: "koa" }, { value: "none" }];
        }
        return [{ value: "vue" }, { value: "react" }, { value: "svelte" }, { value: "none" }];
      })(),
      default: "vue"
    });
    const language = await select({
      message: "请选择要使用的语言",
      choices: [{ value: "javascript" }, { value: "typescript" }],
      default: "javascript"
    });
    const useEslint = await confirm({ message: "是否使用eslint", default: true });
    let [cssPreprocessor, useCssModule] = ["none", false];
    if (!["lib", "server"].includes(mode)) {
      cssPreprocessor = await select({
        message: "请选择要使用的css预处理器",
        choices: [{ value: "less" }, { value: "scss" }, { value: "none" }],
        default: "less"
      });
      useCssModule = await confirm({ message: "是否开启css module", default: true });
    }
    let complier = "webpack";
    if (env === "node" || ["ssr", "lib"].includes(mode)) {
      complier = "vite";
    }
    Object.assign(context, {
      name,
      language,
      frame,
      env,
      mode,
      useEslint,
      useCssModule,
      cssPreprocessor,
      complier
    });
    const TMP_DIR = resolveApp("./tmp");
    fs.mkdirSync(TMP_DIR, { recursive: true });
    const spinner = ora("initializing").start();
    await Promise.all(
      ["rimraf", "cross-env"].map((dep) => limit(async () => {
        const { version } = await npmFetch.json(`/${dep}/latest`);
        Object.assign(context, deepMerge(context, { devDependencies: { [dep]: `^${version}` } }));
      }))
    );
    await Promise.all(
      ["react", "react-dom"].map((dep) => limit(async () => {
        const { version } = await npmFetch.json(`/${dep}/latest`);
        Object.assign(context, deepMerge(context, { dependencies: { [dep]: `^${version}` } }));
      }))
    );
    fs.cpSync(resolveApp("./template/base"), TMP_DIR, { recursive: true });
    if (complier === "webpack") {
      spinner.stop();
      const javascriptSpinner2 = ora("initializing webpack").start();
      const { createFileMap, getDevDeps, getDeps } = webpack(context);
      const fileMap = createFileMap();
      Object.keys(fileMap).forEach((key) => {
        const content = fileMap[key]();
        fs.writeFileSync(TMP_DIR + key, content);
      });
      await Promise.all(
        (await getDevDeps()).map((dep) => limit(async () => {
          const { version } = await npmFetch.json(`/${dep}/latest`);
          Object.assign(context, deepMerge(context, { devDependencies: { [dep]: `^${version}` } }));
        }))
      );
      await Promise.all(
        (await getDeps()).map((dep) => limit(async () => {
          const { version } = await npmFetch.json(`/${dep}/latest`);
          Object.assign(context, deepMerge(context, { dependencies: { [dep]: `^${version}` } }));
        }))
      );
      javascriptSpinner2.succeed("create webpack succeed");
      spinner.start();
    }
    spinner.stop();
    const javascriptSpinner = ora("initializing javascript").start();
    const { createFileMap: createJavascriptFileMap, getDevDeps: getJavascriptDevDeps, getDeps: getJavascriptDeps } = javascript(context);
    const javascriptFileMap = createJavascriptFileMap();
    Object.keys(javascriptFileMap).forEach((key) => {
      const content = javascriptFileMap[key]();
      fs.writeFileSync(TMP_DIR + key, content);
    });
    await Promise.all(
      (await getJavascriptDevDeps()).map((dep) => limit(async () => {
        const { version } = await npmFetch.json(`/${dep}/latest`);
        Object.assign(context, deepMerge(context, { devDependencies: { [dep]: `^${version}` } }));
      }))
    );
    await Promise.all(
      (await getJavascriptDeps()).map((dep) => limit(async () => {
        const { version } = await npmFetch.json(`/${dep}/latest`);
        Object.assign(context, deepMerge(context, { dependencies: { [dep]: `^${version}` } }));
      }))
    );
    javascriptSpinner.succeed("create eslint succeed");
    spinner.start();
    spinner.stop();
    const babelSpinner = ora("initializing babel").start();
    const { createFileMap: createBabelFileMap, getDevDeps: getBabelDevDeps, getDeps: getBabelDeps } = babel(context);
    const babelFileMap = createBabelFileMap();
    Object.keys(babelFileMap).forEach((key) => {
      const content = babelFileMap[key]();
      fs.writeFileSync(TMP_DIR + key, content);
    });
    await Promise.all(
      (await getBabelDevDeps()).map((dep) => limit(async () => {
        const { version } = await npmFetch.json(`/${dep}/latest`);
        Object.assign(context, deepMerge(context, { devDependencies: { [dep]: `^${version}` } }));
      }))
    );
    await Promise.all(
      (await getBabelDeps()).map((dep) => limit(async () => {
        const { version } = await npmFetch.json(`/${dep}/latest`);
        Object.assign(context, deepMerge(context, { dependencies: { [dep]: `^${version}` } }));
      }))
    );
    babelSpinner.succeed("create babel succeed");
    spinner.start();
    if (useEslint) {
      spinner.stop();
      const eslintSpinner = ora("initializing eslint").start();
      const { createFileMap: createEslintFileMap, getDevDeps } = eslint(context);
      const eslintFileMap = createEslintFileMap();
      Object.keys(eslintFileMap).forEach((key) => {
        const content = eslintFileMap[key]();
        fs.writeFileSync(TMP_DIR + key, content);
      });
      await Promise.all(
        (await getDevDeps()).map((dep) => limit(async () => {
          const { version } = await npmFetch.json(`/${dep}/latest`);
          Object.assign(context, deepMerge(context, { devDependencies: { [dep]: `^${version}` } }));
        }))
      );
      eslintSpinner.succeed("create eslint succeed");
      spinner.start();
    }
    const { createFileMap: createPackageJsonFileMap } = packagejson(context);
    const packageJsonFileMap = createPackageJsonFileMap(context);
    Object.keys(packageJsonFileMap).forEach((key) => {
      const content = packageJsonFileMap[key]();
      fs.writeFileSync(TMP_DIR + key, content);
    });
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
