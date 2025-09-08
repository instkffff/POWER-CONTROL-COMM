// frontend-launcher.mjs
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

// 获取当前文件的目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 将 fs.readFile 转换为 Promise 版本
const readFile = promisify(fs.readFile);

// 创建服务器
const server = http.createServer(async (req, res) => {
  // 解析请求URL
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;
  
  // 默认页面
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // 构建文件路径
  const filePath = path.join(__dirname, 'frontend', 'dist', pathname);
  
  // 获取文件扩展名
  const extname = path.extname(filePath).toLowerCase();
  
  // 设置内容类型
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };
  
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  try {
    // 读取并返回文件
    const content = await readFile(filePath);
    
    // 成功返回文件
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      // 文件未找到
      try {
        const content = await readFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
      } catch (fallbackErr) {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: ' + fallbackErr.code);
      }
    } else {
      // 其他服务器错误
      res.writeHead(500);
      res.end('Sorry, check with the site admin for error: ' + err.code);
    }
  }
});

// 监听端口
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Access your app at http://localhost:${PORT}`);
});