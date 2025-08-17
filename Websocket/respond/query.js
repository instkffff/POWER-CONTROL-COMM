/* 
query 处理 

数据API 格式如下

采用 websocket 连接

// 发送状态请求

{
    "type": "status", // status | basicSetting | readKWHR | schedule | windowSetting
    "requestID": "请求ID", // 5位随机数
    "data": {
        "deviceIDList": [], // 设备ID列表
        "levelList": [], // 楼层列表
        "groupList": [], // 组列表
        "roomIDList": [] // 房间ID列表
    }
}

// 返回状态

{
    "type": "status", // status | basicSetting | readKWHR | schedule | windowSetting
    "requestID": "请求ID",
    "data": { 
        "jsonArray": []
    }
}

*/

import { query } from '../../Database/main.js';

// 处理查询请求
export function handleQueryRequest(ws, requestData) {
  const { type, requestID, data } = requestData;
  
  try {
    // 根据请求类型调用相应的查询函数
    let queryResult;
    
    switch (type) {
      case 'status':
        queryResult = query.status(data);
        break;
      case 'basicSetting':
        queryResult = query.basicSetting(data);
        break;
      case 'schedule':
        queryResult = query.schedule(data);
        break;
      case 'windowSetting':
        queryResult = query.windowSetting(data);
        break;
      case 'readKWHR':
        queryResult = query.readKWHR(data);
        break;
      default:
        throw new Error(`不支持的查询类型: ${type}`);
    }
    
    // 构造响应数据
    const response = {
      type: type,
      requestID: requestID,
      data: {
        jsonArray: queryResult || []
      }
    };
    
    // 发送响应
    ws.send(JSON.stringify(response));
    
  } catch (error) {
    console.error('处理查询请求时出错:', error);
    
    // 发送错误响应
    const errorResponse = {
      type: type,
      requestID: requestID,
      error: error.message
    };
    
    ws.send(JSON.stringify(errorResponse));
  }
}

// 检查是否为查询请求类型
export function isQueryRequest(type) {
  return ['status', 'basicSetting', 'schedule', 'windowSetting', 'readKWHR'].includes(type);
}