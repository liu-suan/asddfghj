/* 轻伴 LightMate — 零依赖本地静态服务器
 * 用法： node serve.js  [端口]
 * 说明：双击 index.html 也能跑（浏览器允许 file:// 使用 localStorage）。
 *       用本地服务器打开可以规避个别浏览器对 file:// 的限制。
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.argv[2] || 5173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const target = path.normalize(path.join(ROOT, urlPath));
  if (!target.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 越权路径');
  }

  fs.readFile(target, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 未找到：' + urlPath);
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(buf);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  轻伴 LightMate 已启动');
  console.log('  →  http://localhost:' + PORT + '/');
  console.log('  （Ctrl + C 停止）');
  console.log('');
});
