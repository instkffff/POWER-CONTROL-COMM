/* 
websocket server框架 

1. 使用 ws模块
2. 使用 token 验证用户建立连接
3. 给发送失败留个空的处理函数插入位置
4. 这里只是框架 功能我在别的函数实现

*/

import { WebSocketServer } from 'ws';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { handleQueryRequest, isQueryRequest } from './respond/query.js';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// 创建WebSocket服务器

const port = 3001;
const wss = new WebSocketServer({ port:port });

// 存储已连接的客户端
const clients = new Map();

// 验证token的函数
async function verifyToken(token) {
  try {
    // 读取token.json文件
    const tokenPath = join(__dirname, '..', 'token.json');
    const tokenData = await readFile(tokenPath, 'utf8');
    const tokens = JSON.parse(tokenData);
    
    // 检查token是否存在
    return tokens[token] !== undefined;
  } catch (error) {
    console.error('Token验证错误:', error);
    return false;
  }
}

// 发送失败时的处理函数（留空供插入具体实现）
export function handleSendFailure(ws, error, message) {
  // TODO: 在这里实现发送失败的处理逻辑
  console.error('WebSocket发送失败:', error);
}

// 处理接收到的消息
function handleMessage(ws, message) {
  try {
    const data = JSON.parse(message);
    
    // 检查是否为查询请求
    if (isQueryRequest(data.type)) {
      handleQueryRequest(ws, data);
      return;
    }
    
    switch (data.type) {
      case 'command':
        handleCommandRequest(ws, data);
        break;
      default:
        ws.send(JSON.stringify({
          error: '未知的消息类型',
          received: data
        }));
    }
  } catch (error) {
    console.error('处理消息时出错:', error);
    ws.send(JSON.stringify({
      error: '消息格式错误'
    }));
  }
}

// 处理命令请求
function handleCommandRequest(ws, data) {
  // TODO: 实现命令请求的具体逻辑
  console.log('处理命令请求:', data);
  
  // 示例响应
  const response = {
    type: 'command',
    requestID: data.requestID,
    status: 'success'
  };
  
  ws.send(JSON.stringify(response));
}

// 广播消息给所有连接的客户端
export function broadcast(message, predicate = () => true) {
  const msg = typeof message === 'string' ? message : JSON.stringify(message);
  
  clients.forEach((clientData, ws) => {
    if (ws.readyState === WebSocket.OPEN && predicate(ws, clientData)) {
      try {
        ws.send(msg);
      } catch (error) {
        handleSendFailure(ws, error, msg);
      }
    }
  });
}

// WebSocket连接处理
wss.on('connection', async (ws, req) => {
  // 解析URL参数获取token
  const params = new URLSearchParams(req.url.split('?')[1]);
  const token = params.get('token');
  
  // 验证token
  if (!await verifyToken(token)) {
    ws.close(4001, '无效的token');
    return;
  }
  
  // 存储客户端信息
  clients.set(ws, { token, connectedAt: new Date() });
  
  console.log('客户端已连接，当前连接数:', clients.size);
  
  // 监听消息
  ws.on('message', (message) => {
    handleMessage(ws, message);
  });
  
  // 监听错误
  ws.on('error', (error) => {
    console.error('WebSocket错误:', error);
  });
  
  // 监听连接关闭
  ws.on('close', (code, reason) => {
    clients.delete(ws);
    console.log('客户端断开连接，当前连接数:', clients.size);
    console.log('关闭代码:', code, '原因:', reason.toString());
  });
  
  // 发送连接成功的消息
  ws.send(JSON.stringify({
    type: 'connection',
    status: 'success',
    message: '连接已建立'
  }));
});

// 监听服务器错误
wss.on('error', (error) => {
  console.error('服务器错误:', error);
});

console.log('WebSocket服务器运行在端口:' + port);

// 导出供其他模块使用
export { wss };