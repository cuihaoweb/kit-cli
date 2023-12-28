import shelljs from 'shelljs';
import fs from 'fs';
import {resolveApp} from './utils.js';

shelljs.cd('/usr/local');
// shelljs.cp(resolveApp('./.npmrc'), './')
fs.cpSync(resolveApp('./.npmrc'), './');
shelljs.echo(shelljs.ls());
