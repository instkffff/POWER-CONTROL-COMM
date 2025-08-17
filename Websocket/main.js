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
import { handleCommandRequest } from './request/missionList.js';

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
function handleSendFailure(ws, error, message) {
  // TODO: 在这里实现发送失败的处理逻辑
  console.error('WebSocket发送失败:', error);
}

/**
 * 统一发送消息函数
 * @param {WebSocket} ws - WebSocket连接
 * @param {Object} message - 要发送的消息对象
 * @param {Function} callback - 发送完成回调函数
 */
function sendWebSocketMessage(ws, message, callback) {
  try {
    const messageString = JSON.stringify(message);
    ws.send(messageString);
    
    if (callback && typeof callback === 'function') {
      callback(null);
    }
  } catch (error) {
    console.error('WebSocket发送失败:', error);
    handleSendFailure(ws, error, message);
    
    if (callback && typeof callback === 'function') {
      callback(error);
    }
  }
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
        handleCommandRequest(ws, data)
          .catch(error => {
            console.error('处理命令请求时出错:', error);
          });
        break;
      default:
        sendWebSocketMessage(ws, {
          error: '未知的消息类型',
          received: data
        });
    }
  } catch (error) {
    console.error('处理消息时出错:', error);
    sendWebSocketMessage(ws, {
      error: '消息格式错误'
    });
  }
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
  sendWebSocketMessage(ws, {
    type: 'connection',
    status: 'success',
    message: '连接已建立'
  });
});

// 监听服务器错误
wss.on('error', (error) => {
  console.error('服务器错误:', error);
});

console.log('WebSocket服务器运行在端口:' + port);

// 导出供其他模块使用
export { wss, sendWebSocketMessage, handleSendFailure };