import { createHttpServer } from './Http/main.js';
import { wss } from './Websocket/main.js';
import { startSerialService } from './Serial/main.js'; // 导入串口服务

const server = createHttpServer();

server.listen(3000, () => {
  console.log('Server running on port 3000');
});

// 监听WebSocket服务器错误
wss.on('error', (error) => {
  console.error('WebSocket服务器错误:', error);
});

// 启动串口服务
startSerialService();