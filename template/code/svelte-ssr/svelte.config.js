import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';

export default {
    compilerOptions: {
        hydratable: true
    },
    preprocess: vitePreprocess()
};
