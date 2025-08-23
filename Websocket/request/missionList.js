import { emit, on, off, EVENT_TYPES } from '../eventList.js';
import { sendWebSocketMessage } from '../main.js';
// import { addMission } from './missionLog.js'

const flag = {};
async function handleCommandRequest(ws, requestData) {

  flag.ws = ws;
  flag.requestData = requestData;
  /* // missionLog
  await addMission(requestData); */

  if (flag.queen === 1) {
    // 先设置标志位再发送停止命令
    flag.replace = 1; // 标记这是一个替换操作
    flag.queen = 0;
    missionStop();
  } else {
    // 先注册事件监听器再发送任务
    removeEventListeners();
    addEventListeners();
    missionSend(requestData);
    flag.queen = 1;
    flag.replace = 0; // 确保不是替换操作
  }
}

function handleRs485Success(data) {
  const ws = flag.ws;
  sendWebSocketMessage(ws, data);
}

function handleRs485Failed(data) {
  const ws = flag.ws;
  sendWebSocketMessage(ws, data);
}

function handleMissionSuccess(data) {
  const ws = flag.ws;
  sendWebSocketMessage(ws, data);
  flag.queen = 0; // 任务成功完成，重置状态
  flag.replace = 0;
  removeEventListeners();
}

function handleMissionFailed(data) {
  const ws = flag.ws;
  const requestData = flag.requestData;
  
  // 如果是替换操作，则发送新任务
  if (flag.replace === 1) {
    // 重新注册事件监听器
    removeEventListeners();
    addEventListeners();
    missionSend(requestData);
    flag.queen = 1;
    flag.replace = 0; // 清除替换标记
    sendWebSocketMessage(ws, data);
  } else {
    // 普通任务失败
    flag.queen = 0;
    sendWebSocketMessage(ws, data);
    removeEventListeners();
  }
}

function addEventListeners() {
  // 先移除所有监听器再添加，防止重复注册
  removeEventListeners();
  on(EVENT_TYPES.RS485_SUCCESS, handleRs485Success);
  on(EVENT_TYPES.RS485_FAILED, handleRs485Failed);
  on(EVENT_TYPES.MISSION_SUCCESS, handleMissionSuccess);
  on(EVENT_TYPES.MISSION_FAILED, handleMissionFailed);
}

function removeEventListeners() {
  off(EVENT_TYPES.RS485_SUCCESS, handleRs485Success);
  off(EVENT_TYPES.RS485_FAILED, handleRs485Failed);
  off(EVENT_TYPES.MISSION_SUCCESS, handleMissionSuccess);
  off(EVENT_TYPES.MISSION_FAILED, handleMissionFailed);
}

function missionSend(requestData) { 
  const ws = flag.ws;
  const data = {
    type: 'command',
    RequestID: requestData.requestID,
    status: 'start',
    message: '任务开始',
    code: 0
  }
  sendWebSocketMessage(ws, data);
  emit(EVENT_TYPES.CRON_STOP);
  setTimeout(() => {
    emit(EVENT_TYPES.MISSION_SEND, requestData);
  }, 100);
}

function missionStop() {
  emit(EVENT_TYPES.MISSION_STOP);
}

export { handleCommandRequest }