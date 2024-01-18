import fs from 'node:fs/promises';
import express from 'express';

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;
const base = process.env.BASE || '/';

let templateHtml = '';
let ssrManifest;
if (isProduction) {
    templateHtml = await fs.readFile('./dist/client/index.html', 'utf-8');
    ssrManifest = await fs.readFile('./dist/client/.vite/ssr-manifest.json', 'utf-8')
}


const app = express();


let vite;
if (!isProduction) {
    const { createServer } = await import('vite');
    vite = await createServer({
        server: { middlewareMode: true },
        appType: 'custom',
        base
    });
    app.use(vite.middlewares);
} else {
    const compression = (await import('compression')).default;
    const sirv = (await import('sirv')).default;
    // gzip压缩
    app.use(compression());
    // 提供缓存
    app.use(base, sirv('./dist/client', { extensions: [] }));
}


app.use('*', async (req, res) => {
    try {
        const url = req.originalUrl.replace(base, '');

        let template;
        let render;
        if (!isProduction) {
            template = await fs.readFile('./index.html', 'utf-8');
            template = await vite.transformIndexHtml(url, template);
            render = (await vite.ssrLoadModule('/src/entry-server.js')).render;
        } else {
            template = templateHtml;
            render = (await import('./dist/server/entry-server.js')).render;
        }

        const rendered = await render(url, ssrManifest);

        const html = template
            .replace(`<!--app-head-->`, rendered.head ?? '')
            .replace(`<!--app-html-->`, rendered.html ?? '');

        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
        vite?.ssrFixStacktrace(e);
        console.log(e.stack);
        res.status(500).end(e.stack);
    }
});


app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
