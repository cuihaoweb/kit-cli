#!/usr/bin/env node
import { program } from "commander";
import { input } from "@inquirer/prompts";
import ora from "ora";
import fs from "fs";
import path, { dirname } from "path";
import chalk from "chalk";
import deepMerge from "deepmerge";
import npmFetch from "npm-registry-fetch";
import "./template/vite/index.js";
import packagejson from "./template/packagejson/index.js";
import eslint from "./template/eslint/index.js";
import "./template/javascript/index.js";
import "./template/babel/index.js";
const resolveApp = (...paths) => path.resolve(dirname(""), ...paths);
program.command("create").argument("[appName]", "appName").description("create app").action(async (appName) => {
  let context = {};
  let name = appName || "";
  !name && (name = await input({ message: "请输入应用名称", default: "my-app" }));
  Object.assign(context, { name });
  const TMP_DIR = resolveApp("./tmp");
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const { createFileMap: createEslintFileMap, getDevDeps } = eslint(context);
  const eslintFileMap = createEslintFileMap();
  Object.keys(eslintFileMap).forEach((key) => {
    const content = eslintFileMap[key]();
    fs.writeFileSync(TMP_DIR + key, content);
  });
  const { version } = await npmFetch.json(`eslint/latest`);
  context = deepMerge(context, { devDependencies: { eslint: `^${version}`, lodash: "^1" } });
  const { createFileMap: createPackageJsonFileMap } = packagejson(context);
  const packageJsonFileMap = createPackageJsonFileMap(context);
  Object.keys(packageJsonFileMap).forEach((key) => {
    const content = packageJsonFileMap[key]();
    fs.writeFileSync(TMP_DIR + key, content);
  });
  const spinner = ora("Loading unicorns").start();
  spinner.color = "yellow";
  spinner.text = "Loading rainbows";
  spinner.succeed("create succeed");
  console.log(chalk.blue(
    [
      "done, exec:",
      `   cd ${appName}`,
      "   npm install",
      "   npm run dev"
    ].join("\n")
  ));
});
program.parse();
