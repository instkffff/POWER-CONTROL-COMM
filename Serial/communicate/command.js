import { openSerialPort, closeSerialPort, sendPacket, onPacketReceived, autoReconnect } from '../SerialPort.js'
import { emit, on, off, EVENT_TYPES } from '../../Websocket/eventList.js';

/* 
功能说明 

函数 输入 buffer deviceID retrytimes 返回 buffer

打开关闭串口 不在这里处理 这里只管收发

1. 接收发送绑定 发一条收一条算完成

2. 发送事件

成功 emit rs485Success

// 触发RS485成功事件

emit(EVENT_TYPES.RS485_SUCCESS, { 
  deviceId: '801310', 
  result: 'success'
});

失败 emit rs485failed

// 触发RS485失败事件

emit(EVENT_TYPES.RS485_FAILED, { 
  deviceId: '801311', 
  result: 'failed',
});



事件列表 来自 eventList.js

event emit 建立与监听函数模块 事件模块可以导入其它地方 灵活插入使用

1. rs485事件

成功事件
rs485Success

失败事件
rs485failed

2. 命令列表建立事件

missionList

3. 命令列表执行完成事件

missionSuccess

*/

let responseTimeout = 500; // 1秒超时

/**
 * 发送命令并等待响应
 * @param {Buffer} buffer - 要发送的数据
 * @param {string} deviceId - 设备ID
 * @param {number} retryTimes - 重试次数
 * @returns {Promise<Buffer>} 接收到的响应数据
 */
const sendCommand = async (buffer, deviceId, retryTimes = 3) => {
  let retries = 0;

  const sendAndReceive = () => {
    return new Promise(async (resolve, reject) => {
      try {
        // 发送数据
        await sendPacket(buffer);
        
        // 设置超时计时器
        const timeout = setTimeout(() => {
          handleFailure(new Error('Response timeout'));
        }, responseTimeout);

        // 监听响应数据
        const unsubscribe = onPacketReceived((data) => {
          clearTimeout(timeout);
          unsubscribe();
          
          // 触发成功事件
          emit(EVENT_TYPES.RS485_SUCCESS, {
            deviceId: deviceId,
            result: 'success'
          });
          
          resolve(data);
        });

        // 错误处理函数
        const handleFailure = (error) => {
          clearTimeout(timeout);
          unsubscribe();
          
          if (retries < retryTimes) {
            retries++;
            console.log(`Retry ${retries}/${retryTimes} for device ${deviceId}`);
            setTimeout(() => {
              sendAndReceive().then(resolve).catch(reject);
            }, 1000); // 1秒后重试
          } else {
            // 触发失败事件
            emit(EVENT_TYPES.RS485_FAILED, {
              deviceId: deviceId,
              result: 'failed'
            });
            
            reject(error);
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  };

  return await sendAndReceive();
};

/**
 * 设置响应超时时间
 * @param {number} timeout - 超时时间(毫秒)
 */
const setResponseTimeout = (timeout) => {
  responseTimeout = timeout;
};

export {
  sendCommand,
  setResponseTimeout
};