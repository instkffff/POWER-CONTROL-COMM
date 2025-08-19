/* 这是一个 WebSocket 服务器框架。

    1. 使用 'ws' 模块。
    2. 使用 token 进行用户验证。
    3. 预留了处理发送失败的空函数。
    4. 此文件作为框架，具体功能实现在其他模块中。
*/

import { WebSocketServer } from 'ws';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { handleQueryRequest, isQueryRequest } from './respond/query.js';
import { handleCommandRequest } from './request/missionList.js';

// --- 配置与初始化 ---
const PORT = 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const wss = new WebSocketServer({ port: PORT });
const clients = new Map();

// --- 身份验证 ---

/**
 * 异步验证给定的 token 是否有效。
 * 它会从 `token.json` 文件中读取数据以检查 token 是否存在。
 * @param {string} token - 要验证的 token。
 * @returns {Promise<boolean>} 一个 Promise，如果 token 有效则解析为 true，否则为 false。
 */
async function verifyToken(token) {
  if (!token) {
    return false;
  }
  try {
    const tokenPath = join(__dirname, '..', 'token.json');
    const tokenData = await readFile(tokenPath, 'utf8');
    const tokens = JSON.parse(tokenData);
    return tokens.hasOwnProperty(token);
  } catch (error) {
    console.error('Token 验证失败:', error);
    return false;
  }
}

// --- 消息处理工具函数 ---

/**
 * 处理发送失败的占位函数。
 * 可以在这里实现具体逻辑，例如记录日志、向客户端发送错误或重试。
 * @param {WebSocket} ws - WebSocket 连接。
 * @param {Error} error - 错误对象。
 * @param {Object} message - 发送失败的消息对象。
 */
function handleSendFailure(ws, error, message) {
  // TODO: 在这里添加你的自定义逻辑。
  console.error('WebSocket 发送失败:', error);
}

/**
 * 统一发送消息的函数。
 * 它可以处理 JSON 对象的字符串化和错误处理。
 * @param {WebSocket} ws - WebSocket 连接。
 * @param {Object} message - 要发送的消息对象。
 * @param {Function} [callback] - 可选的回调函数，在发送尝试后执行。
 */
function sendWebSocketMessage(ws, message, callback) {
  if (ws.readyState !== ws.OPEN) {
    // 阻止向已关闭或正在关闭的套接字发送消息。
    if (callback) callback(new Error('WebSocket 连接未打开。'));
    return;
  }
  try {
    const messageString = JSON.stringify(message);
    ws.send(messageString, (error) => {
      if (error) {
        handleSendFailure(ws, error, message);
        if (callback) callback(error);
      } else {
        if (callback) callback(null);
      }
    });
  } catch (error) {
    console.error('消息序列化和发送失败:', error);
    handleSendFailure(ws, error, message);
    if (callback) callback(error);
  }
}

/**
 * 处理接收到的消息，解析消息并分派给相应的处理函数。
 * @param {WebSocket} ws - WebSocket 连接。
 * @param {string} message - 接收到的原始消息字符串。
 */
function handleIncomingMessage(ws, message) {
  try {
    const data = JSON.parse(message);
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
          error: '未知消息类型',
          received: data
        });
        break;
    }
  } catch (error) {
    console.error('处理传入消息时出错:', error);
    sendWebSocketMessage(ws, {
      error: '消息格式错误。请发送有效的 JSON。'
    });
  }
}

// --- WebSocket 事件监听器 ---

wss.on('connection', async (ws, req) => {
  const params = new URLSearchParams(req.url.split('?')[1]);
  const token = params.get('token');

  // 身份验证
  if (!await verifyToken(token)) {
    ws.close(4001, '无效的 token');
    return;
  }

  // 存储客户端信息并记录连接
  clients.set(ws, { token, connectedAt: new Date() });
  console.log(`客户端已连接。当前连接数: ${clients.size}`);

  // 为新连接设置事件处理程序
  ws.on('message', (message) => handleIncomingMessage(ws, message));
  ws.on('error', (error) => console.error('WebSocket 错误:', error));
  ws.on('close', (code, reason) => {
    clients.delete(ws);
    console.log(`客户端断开连接。当前连接数: ${clients.size}`);
    console.log(`关闭代码: ${code}, 原因: ${reason.toString()}`);
  });

  // 发送连接成功消息
  sendWebSocketMessage(ws, {
    type: 'connection',
    status: 'success',
    message: '连接已建立。'
  });
});

wss.on('error', (error) => {
  console.error('WebSocket 服务器错误:', error);
});

// --- 服务器启动 ---
console.log(`WebSocket 服务器正在端口 ${PORT} 上运行...`);

// --- 导出 ---
export { wss, sendWebSocketMessage, handleSendFailure };