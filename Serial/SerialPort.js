/* 
串口通讯框架 

半双工通讯

1. 发送包函数
2. 接受包监听
3. 打开串口函数
4. 关闭串口函数

*/

import { SerialPort } from 'serialport';

let serialPortInstance = null;
let isConnected = false;
let reconnectAttempts = 0;
let maxReconnectAttempts = 3; // 设置为无穷大，实现无限重连
let reconnectDelay = 1000; // 1秒

/**
 * 打开串口函数
 * @param {string} path - 串口路径
 * @param {object} options - 串口配置选项
 * @returns {Promise<SerialPort>} 串口实例
 */
const openSerialPort = (path, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      // 如果已经连接，先关闭再重新连接
      if (isConnected && serialPortInstance) {
        closeSerialPort().then(() => {
          // 继续执行连接逻辑
        }).catch(() => {
          // 即使关闭失败也继续尝试连接
        });
      }

      const defaultOptions = {
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        autoOpen: false, // 不自动打开，我们手动控制
        ...options
      };

      serialPortInstance = new SerialPort({
        path,
        ...defaultOptions
      });

      // 监听断开连接事件
      serialPortInstance.on('close', () => {
        isConnected = false;
        console.log('Serial port closed');
        // 可以在这里触发自动重连逻辑
      });

      serialPortInstance.on('error', (error) => {
        isConnected = false;
        console.error('Serial port error:', error);
        // 可以在这里触发自动重连逻辑
      });

      // 打开串口
      serialPortInstance.open((error) => {
        if (error) {
          isConnected = false;
          reject(error);
        } else {
          isConnected = true;
          reconnectAttempts = 0; // 重置重连次数
          resolve(serialPortInstance);
        }
      });

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 自动重连函数
 * @param {string} path - 串口路径
 * @param {object} options - 串口配置选项
 */
const autoReconnect = (path, options) => {
  reconnectAttempts++;
  console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts} attempts)`);

  // 添加重连次数检查
  if (reconnectAttempts <= maxReconnectAttempts) {
    setTimeout(() => {
      openSerialPort(path, options)
        .then(() => {
          console.log('Reconnected successfully');
        })
        .catch(() => {
          // 继续尝试重连
          autoReconnect(path, options);
        });
    }, reconnectDelay);
  } else {
    console.error('Max reconnect attempts reached');
    // 可以在这里添加其他错误处理逻辑
  }
};

/**
 * 关闭串口函数
 * @returns {Promise<void>}
 */
const closeSerialPort = () => {
  return new Promise((resolve, reject) => {
    if (!isConnected || !serialPortInstance) {
      return resolve();
    }

    serialPortInstance.close((error) => {
      if (error) {
        reject(error);
      } else {
        isConnected = false;
        serialPortInstance = null;
        reconnectAttempts = 0;
        resolve();
      }
    });
  });
};

/**
 * 发送包函数（带重试机制）
 * @param {Buffer|string|Array} data - 要发送的数据
 * @param {number} retries - 重试次数
 * @returns {Promise<void>}
 */
const sendPacket = (data, retries = 3) => {
  return new Promise((resolve, reject) => {
    if (!isConnected || !serialPortInstance) {
      // 如果未连接，尝试重连后发送
      return reject(new Error('Serial port is not open'));
    }

    serialPortInstance.write(data, (error) => {
      if (error) {
        // 如果是连接错误且还有重试次数，尝试重连
        if (retries > 0) {
          console.log(`Send failed, retrying... (${retries} attempts left)`);
          setTimeout(() => {
            sendPacket(data, retries - 1).then(resolve).catch(reject);
          }, 500);
        } else {
          reject(error);
        }
      } else {
        resolve();
      }
    });
  });
};

/**
 * 接受包监听
 * @param {function} onData - 接收到数据时的回调函数
 * @returns {function} 取消监听的函数
 */
const onPacketReceived = (onData) => {
  if (!isConnected || !serialPortInstance) {
    throw new Error('Serial port is not open');
  }

  const dataHandler = (data) => {
    onData(data);
  };

  serialPortInstance.on('data', dataHandler);

  // 返回取消监听的函数
  return () => {
    if (serialPortInstance) {
      serialPortInstance.removeListener('data', dataHandler);
    }
  };
};

export {
  openSerialPort,
  closeSerialPort,
  sendPacket,
  onPacketReceived,
  autoReconnect
};