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


/* // 监听事件
on(EVENT_TYPES.RS485_SUCCESS, (data) => {
  console.log('RS485操作成功:', data);
});

// 触发事件
emit(EVENT_TYPES.RS485_SUCCESS, { deviceId: '001', result: 'success' }); */