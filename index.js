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

/* {
  "type": "status",
  "requestID": "12345",
  "data": {
    "deviceIDList": [801001, 801002, 801003],
    "levelList": [1, 2, 3],
    "groupList": [1, 2],
    "roomIDList": [1001, 1002, 1003]
  }
} */

/* {
  "type": "command",
  "requestID": "12345",
  "data": {
    "IDList": [
      801001,801002,801003,801004,801005,801006,801007
    ],
    "FunctionCode": 11,
    "data": {
      "totalPower": 1000.0,
      "reactivePower": 400.0,
      "activePower": 990.0,
      "inductorPower": 990.0,
      "delay1": 60,
      "delay2": 60,
      "delay3": 60,
      "retry": 4
    }
  }
} */

/* {
  "type": "command",
  "requestID": "12345",
  "data": {
    "IDList": [
      801001,801002,801003,801004,801005,801006,801007
    ],
    "FunctionCode": 7,
    "data": {}
  }
} */