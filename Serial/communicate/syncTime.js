// 同步时间串口发送

import { sendPacket } from '../SerialPort.js';
import { emit, EVENT_TYPES } from '../../Websocket/eventList.js';

let syncTimeout = 1000; // 1秒超时

/**
 * 同步时间命令发送（只发送不接收响应）
 * @param {Buffer} buffer - 要发送的时间同步数据
 * @param {string} deviceId - 设备ID
 * @param {number} retryTimes - 重试次数
 * @returns {Promise<void>}
 */
const syncTime = async (buffer, deviceId, retryTimes = 3) => {
  let retries = 0;

  const sendTimeSync = () => {
    return new Promise(async (resolve, reject) => {
      try {
        // 设置发送超时计时器
        const timeout = setTimeout(() => {
          handleFailure(new Error('Send timeout'));
        }, syncTimeout);

        // 发送数据
        await sendPacket(buffer);
        
        // 清除超时计时器
        clearTimeout(timeout);
        
        // 触发成功事件
        emit(EVENT_TYPES.RS485_SUCCESS, {
          deviceId: deviceId,
          result: 'success'
        });
        
        // 等待10ms后再resolve
        setTimeout(() => {
          resolve();
        }, 10);

      } catch (error) {
        clearTimeout(timeout);
        handleFailure(error);
      }
    });
  };

  // 错误处理函数
  const handleFailure = (error) => {
    return new Promise((resolve, reject) => {
      if (retries < retryTimes) {
        retries++;
        console.log(`Retry ${retries}/${retryTimes} for time sync to device ${deviceId}`);
        setTimeout(() => {
          sendTimeSync().then(resolve).catch(reject);
        }, 1000); // 1秒后重试
      } else {
        // 触发失败事件
        emit(EVENT_TYPES.RS485_FAILED, {
          deviceId: deviceId,
          result: 'failed'
        });
        
        reject(error);
      }
    });
  };

  return await sendTimeSync();
};

/**
 * 设置同步超时时间
 * @param {number} timeout - 超时时间(毫秒)
 */
const setSyncTimeout = (timeout) => {
  syncTimeout = timeout;
};

export {
  syncTime,
  setSyncTimeout
};