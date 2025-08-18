/* 
事件列表 

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

// 存储所有事件监听器
const events = {};

// 监听事件
function on(event, callback) {
  if (!events[event]) {
    events[event] = [];
  }
  events[event].push(callback);
}

// 触发事件
function emit(event, data) {
  if (events[event]) {
    events[event].forEach(callback => {
      if (typeof callback === 'function') {
        callback(data);
      }
    });
  }
}

// 移除事件监听
function off(event, callback) {
  if (events[event]) {
    const index = events[event].indexOf(callback);
    if (index > -1) {
      events[event].splice(index, 1);
    }
  }
}

// 定义事件名称常量
const EVENT_TYPES = {
  RS485_SUCCESS: 'rs485Success',
  RS485_FAILED: 'rs485failed',
  MISSION_LIST: 'missionList',
  MISSION_SUCCESS: 'missionSuccess'
};

// 导出模块
export {
  on,
  emit,
  off,
  EVENT_TYPES
};


/* // 示例1: 监听RS485成功事件
function handleRs485Success(data) {
  console.log('设备操作成功:', data);
  // 处理成功逻辑
}

// 示例2: 监听RS485失败事件
function handleRs485Failed(data) {
  console.log('设备操作失败:', data);
  console.log('失败设备ID:', data.deviceId);
  // 处理失败逻辑
}

// 示例3: 监听任务列表事件
function handleMissionList(data) {
  console.log('接收到任务列表:', data);
  // 处理任务列表逻辑
}

// 示例4: 监听任务完成事件
function handleMissionSuccess(data) {
  console.log('任务完成:', data);
  // 处理任务完成逻辑
}

// 注册事件监听器
on(EVENT_TYPES.RS485_SUCCESS, handleRs485Success);
on(EVENT_TYPES.RS485_FAILED, handleRs485Failed);
on(EVENT_TYPES.MISSION_LIST, handleMissionList);
on(EVENT_TYPES.MISSION_SUCCESS, handleMissionSuccess);

// 模拟触发各种事件

// 触发RS485成功事件
console.log('=== 触发RS485成功事件 ===');
emit(EVENT_TYPES.RS485_SUCCESS, { 
  deviceId: '801310', 
  result: 'success'
});

// 触发RS485失败事件
console.log('\n=== 触发RS485失败事件 ===');
emit(EVENT_TYPES.RS485_FAILED, { 
  deviceId: '801311', 
  error: 'timeout',
  message: '设备无响应'
});

// 触发任务列表事件
console.log('\n=== 触发任务列表事件 ===');
emit(EVENT_TYPES.MISSION_LIST, { 
  IDList: [801310, 801311, 801312],
  FunctionCode: 7,
  data: { command: 'read status' }
});

// 触发任务完成事件
console.log('\n=== 触发任务完成事件 ===');
emit(EVENT_TYPES.MISSION_SUCCESS, { 
  requestID: '12345',
  completedDevices: 3,
  totalDevices: 3
});

// 演示移除事件监听器
console.log('\n=== 移除RS485成功事件监听器 ===');
off(EVENT_TYPES.RS485_SUCCESS, handleRs485Success);

// 再次触发RS485成功事件，这次不会被处理
console.log('再次触发RS485成功事件（监听器已移除）:');
emit(EVENT_TYPES.RS485_SUCCESS, { 
  deviceId: '801312', 
  result: 'success'
});

console.log('\n=== 示例结束 ==='); */
