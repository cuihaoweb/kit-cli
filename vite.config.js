import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';
import path from 'path';

const CWD_PATH = process.cwd();
const resolveApp = (...paths) => path.resolve(CWD_PATH, ...paths);

export default defineConfig({
    build: {
        lib: {
            entry: resolveApp('./index.mjs'),
            formats: ['es'],
            name: 'kit-cli',
            fileName: '[name].js'
        },
        outDir: './',
        rollupOptions: {
            external: /template/
        },
    },
    plugins: [
        ...VitePluginNode({
            appPath: resolveApp('./index.mjs'),
        })
    ]
});
