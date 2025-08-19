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
  MISSION_SEND: 'missionSend',
  MISSION_SUCCESS: 'missionSuccess',
  MISSION_FAILED: 'missionFailed',
  MISSION_STOP: 'missionStop'
};

// 导出模块
export {
  on,
  emit,
  off,
  EVENT_TYPES
};