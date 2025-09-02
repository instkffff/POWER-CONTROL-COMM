// http server

import http from 'http';
import url from 'url';
import { parse } from 'querystring';
import fs from 'fs';
import path from 'path';

// userList.json 和 token.json 文件路径
const USER_LIST_FILE = path.resolve('userList.json');
const TOKEN_FILE = path.resolve('token.json');

// 读取用户数据
function readUsers() {
  try {
    if (fs.existsSync(USER_LIST_FILE)) {
      const data = fs.readFileSync(USER_LIST_FILE, 'utf8');
      const userData = JSON.parse(data);
      return userData.userList || [];
    }
  } catch (err) {
    console.error('Error reading user list file:', err);
  }
  return [];
}

// 读取 token 数据
function readTokens() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const data = fs.readFileSync(TOKEN_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading token file:', err);
  }
  return {};
}

// 保存 token 数据
function saveTokens(tokens) {
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
  } catch (err) {
    console.error('Error writing token file:', err);
  }
}

// 清理过期 token (超过24小时)
function cleanupExpiredTokens() {
  const tokens = readTokens();
  const now = Date.now();
  const updatedTokens = {};
  
  for (const [token, data] of Object.entries(tokens)) {
    // 24小时 = 24 * 60 * 60 * 1000 毫秒
    if (now - data.createdAt < 24 * 60 * 60 * 1000) {
      updatedTokens[token] = data;
    }
  }
  
  saveTokens(updatedTokens);
  return updatedTokens;
}

// 生成随机 token
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// 删除指定用户的旧 token
function removeUserTokens(phone) {
  const tokens = readTokens();
  const updatedTokens = {};
  
  for (const [token, data] of Object.entries(tokens)) {
    if (data.phone !== phone) {
      updatedTokens[token] = data;
    }
  }
  
  saveTokens(updatedTokens);
}

// 解析请求体
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve(parse(body));
      }
    });
    req.on('error', reject);
  });
}

// 处理登录请求
async function handleLogin(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const body = await parseBody(req);
    const { number, password } = body;

    // 读取用户数据
    const users = readUsers();
    
    // 验证用户凭据 (注意: 文档中使用number, userList.json中使用phone)
    const user = users.find(u => u.phone === number && u.password === password);

    res.setHeader('Content-Type', 'application/json');

    if (user) {
      // 清理过期 token
      cleanupExpiredTokens();
      
      // 删除该用户之前的 token
      removeUserTokens(number);
      
      // 生成新 token
      const token = generateToken();
      
      // 读取现有 token 数据
      const tokens = readTokens();
      
      // 添加新 token
      tokens[token] = {
        phone: user.phone,
        name: user.name,
        createdAt: Date.now()
      };
      
      // 保存 token 数据
      saveTokens(tokens);
      
      // 返回成功响应
      res.statusCode = 200;
      res.end(JSON.stringify({
        code: 0,
        name: user.name,
        token: token,
        phone: user.phone
      }));
    } else {
      // 返回失败响应
      res.statusCode = 401;
      res.end(JSON.stringify({
        code: 1,
        message: '电话号或密码错误'
      }));
    }
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
}

// 创建 HTTP 服务器
function createHttpServer() {
  return http.createServer((req, res) => {
    // 添加 CORS 支持
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;

    // 路由处理
    if (path === '/api/login') {
      handleLogin(req, res);
    } else {
      // 404 处理
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  });
}

// 启动服务器函数
function startHttpServer(port = 3000) {
  const server = createHttpServer();
  server.listen(port, () => {
    console.log(`HTTP server running on port ${port}`);
  });
  return server;
}

// 导出模块
export {
  createHttpServer,
  startHttpServer
};