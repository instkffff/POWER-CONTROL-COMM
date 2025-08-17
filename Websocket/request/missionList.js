/* 
任务列表 

1. 把命令列表写到 missionList.json

2. 触发 missionList 事件

3. 返回 success

4. 监听 rs485Success 事件

5. 计算执行进度 返回执行进度

6. 监听 rs485failed 事件

7. 返回执行错误 和 错误的设备ID

8. 监听任务完成 missionSuccess 事件

9. 清空 missionList

命令API

采用 websocket 连接

// 发送命令
{
    "type": "command",
    "requestID": "请求ID", // 5位随机数
    "data": {
        "IDList": [
            801310,
            801310,
            801310,
            801310,
            801310,
            801310,
            801310,
            801310
        ], // 设备ID列表
        "FunctionCode": 7, // 命令码
        "data": {} // 命令数据
    }
}

// 响应

{
    "type": "command",
    "requestID": "请求ID",
    "status": "success"
}

// 执行进度返回

{
    "type": "command",
    "requestID": "请求ID",
    "progress": "执行进度" // 百分比 int
}

// 执行错误

{
    "type": "command",
    "requestID": "请求ID",
    "status": "error",
    "deviceID": "设备ID", // 错误设备ID
}

*/

import { writeFile, unlink } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { emit, on, off, EVENT_TYPES } from '../eventList.js';
import { sendWebSocketMessage } from '../main.js'; // 导入统一发送函数

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 存储正在进行的任务
const activeMissions = new Map();

// 初始化时注册全局事件监听器
function initializeMissionHandler() {
  // 监听 rs485Success 事件
  on(EVENT_TYPES.RS485_SUCCESS, handleRs485Success);
  
  // 监听 rs485failed 事件
  on(EVENT_TYPES.RS485_FAILED, handleRs485Failed);
  
  // 监听 missionSuccess 事件
  on(EVENT_TYPES.MISSION_SUCCESS, handleMissionSuccess);
}

// 处理RS485成功事件
function handleRs485Success(deviceData) {
  // 遍历所有活动任务，找到相关的任务并更新进度
  activeMissions.forEach((missionData, requestID) => {
    const { ws, data, completedDevices } = missionData;
    const totalDevices = data.IDList.length;
    
    // 检查这个设备是否属于当前任务
    if (data.IDList.includes(deviceData.deviceId)) {
      // 更新完成设备数
      missionData.completedDevices = completedDevices + 1;
      
      // 计算执行进度并返回
      const progress = Math.floor((missionData.completedDevices / totalDevices) * 100);
      const progressResponse = {
        type: 'command',
        requestID: requestID,
        progress: progress
      };
      sendWebSocketMessage(ws, progressResponse); // 使用统一发送函数
      
      // 检查是否完成所有设备
      if (missionData.completedDevices >= totalDevices) {
        // 任务完成，触发 missionSuccess 事件
        emit(EVENT_TYPES.MISSION_SUCCESS, { requestID, data });
      }
    }
  });
}

// 处理RS485失败事件
function handleRs485Failed(errorData) {
  // 遍历所有活动任务，找到相关的任务并处理错误
  activeMissions.forEach((missionData, requestID) => {
    const { ws, data } = missionData;
    
    // 检查这个设备是否属于当前任务
    if (data.IDList.includes(errorData.deviceId)) {
      // 返回执行错误和错误的设备ID
      const errorResponse = {
        type: 'command',
        requestID: requestID,
        status: 'error',
        deviceID: errorData.deviceId
      };
      sendWebSocketMessage(ws, errorResponse); // 使用统一发送函数
      
      // 从活动任务中移除
      activeMissions.delete(requestID);
      
      // 清空 missionList
      const missionListPath = join(__dirname, '..', '..', 'missionList.json');
      unlink(missionListPath).catch(err => {
        console.error('清空missionList失败:', err);
      });
    }
  });
}

// 处理任务完成事件
function handleMissionSuccess(missionData) {
  const { requestID } = missionData;
  
  // 检查是否是活动任务
  if (activeMissions.has(requestID)) {
    // 从活动任务中移除
    activeMissions.delete(requestID);
    
    // 清空 missionList
    const missionListPath = join(__dirname, '..', '..', 'missionList.json');
    unlink(missionListPath).catch(err => {
      console.error('清空missionList失败:', err);
    });
  }
}

// 处理命令请求
async function handleCommandRequest(ws, requestData) {
  const { requestID, data } = requestData;
  
  try {
    // 1. 把命令列表写到 missionList.json
    const missionListPath = join(__dirname, '..', '..', 'missionList.json');
    
    await writeFile(missionListPath, JSON.stringify(data, null, 2));
    
    // 2. 触发 missionList 事件
    emit(EVENT_TYPES.MISSION_LIST, data);
    
    // 3. 将任务添加到活动任务列表
    activeMissions.set(requestID, {
      ws: ws,
      data: data,
      completedDevices: 0
    });
    
    // 4. 返回 success
    const successResponse = {
      type: 'command',
      requestID: requestID,
      status: 'success'
    };
    sendWebSocketMessage(ws, successResponse); // 使用统一发送函数
  } catch (error) {
    console.error('处理命令请求失败:', error);
    const errorResponse = {
      type: 'command',
      requestID: requestID,
      status: 'error',
      message: '任务创建失败'
    };
    sendWebSocketMessage(ws, errorResponse); // 使用统一发送函数
    throw error;
  }
}

// 初始化任务处理器
initializeMissionHandler();

export { handleCommandRequest };