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
import "./template/vite/index.js";
import packagejson from "./template/packagejson/index.js";
import eslint from "./template/eslint/index.js";
import { cpus } from "os";
import "./template/javascript/index.js";
import "./template/babel/index.js";
const resolveApp = (...paths) => path.resolve(dirname(""), ...paths);
const limit = pLimit(cpus().length - 1);
program.command("create").argument("[appName]", "appName").description("create app").action(async (appName) => {
  const context = {};
  let name = appName || "";
  !name && (name = await input({ message: "请输入应用名称", default: "my-app" }));
  const env = await select({ message: "请选择运行的环境", choices: [{ value: "web" }, { value: "node" }], default: "web" });
  const mode = await select({
    message: "请选择项目的类型",
    choices: (() => {
      const HANDLE_MAP = {
        web: () => [{ value: "spa" }, { value: "lib" }],
        node: () => [{ value: "lib" }, { value: "ssr" }]
      };
      return HANDLE_MAP[env]();
    })(),
    default: "lib"
  });
  const frame = await select({
    message: "请选择使用的框架",
    choices: [{ value: "vue" }, { value: "react" }, { value: "svelte" }, { value: "none" }],
    default: "vue"
  });
  const language = await select({
    message: "请选择要使用的语言",
    choices: [{ value: "javascript" }, { value: "typescript" }],
    default: "javascript"
  });
  const useEslint = await confirm({ message: "是否使用eslint", default: void 0 });
  Object.assign(context, { name, language, frame, env, mode, useEslint });
  const TMP_DIR = resolveApp("./tmp");
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const spinner = ora("initializing").start();
  fs.cpSync(resolveApp("./template/.vscode"), TMP_DIR + "/.vscode", { recursive: true });
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
});
program.parse();
