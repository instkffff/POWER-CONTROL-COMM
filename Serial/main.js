import { openSerialPort, closeSerialPort } from './SerialPort.js';
import { makePacket, parsePacket } from '../packetMaker/main.js';
import { update } from '../Database/main.js';
import { sendCommand } from './communicate/command.js';
import { syncTime } from './communicate/syncTime.js';
import { on, emit, EVENT_TYPES } from '../Websocket/eventList.js';
import { packet } from '../packet/main.js';
import { COMMlog } from '../Log/main.js';

// 任务队列和状态管理
let missionQueue = [];
let isProcessing = false;

// --- mission manager

/**
 * 启动串口通信服务并监听新任务。
 * @param {boolean} test - 是否开启测试模式。
 * @param {number} testid - 测试模式下使用的设备 ID。
 */
const startSerialService = (test = true, testid = 801310) => {
  on(EVENT_TYPES.MISSION_LIST, (missionData) => {
    console.log('收到 missionList 事件，正在处理...');

    // 如果当前正在处理任务，则取消当前任务并用新任务替换。
    if (isProcessing) {
      console.log('收到新任务，取消当前任务...');
      // 清空队列并发送任务失败事件
      missionQueue.length = 0;
      emit(EVENT_TYPES.MISSION_FAILED, {
        result: 'failed',
        error: '被新任务取消'
      });
    }

    missionQueue.push({
      data: missionData,
      test: test,
      testid: testid
    });

    // 如果没有在处理任务，则开始处理队列
    if (!isProcessing) {
      processMissionQueue();
    }
  });

  console.log('串口通信服务已启动，等待 missionList 事件...');
};

/**
 * 顺序处理任务队列。
 */
async function processMissionQueue() {
  if (isProcessing || missionQueue.length === 0) {
    return;
  }

  isProcessing = true;
  const mission = missionQueue.shift();

  try {
    // 打开串口 - 使用固定的配置
    await openSerialPort('COM5', {
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none'
    });

    const results = await handleMission(mission);
    
    await closeSerialPort();
    
    // 发送任务完成事件
    emit(EVENT_TYPES.MISSION_SUCCESS, {
      result: 'success',
      successCount: results.successCount,
      failureCount: results.failureCount
    });

  } catch (error) {
    console.error('处理任务列表时出错:', error);
    try {
      await closeSerialPort();
    } catch (closeError) {
      console.error('关闭串口时出错:', closeError);
    }
    
    if (error.message !== '被新任务取消') {
      emit(EVENT_TYPES.MISSION_FAILED, { result: 'failed', error: error.message });
    }
  } finally {
    isProcessing = false;
    // 如果队列中还有任务，则继续处理下一个
    if (missionQueue.length > 0) {
      processMissionQueue();
    }
  }
}

/**
 * 遍历设备列表并处理单个任务。
 * @param {object} mission - 任务对象。
 * @returns {Promise<object>} - 包含成功和失败数量的对象。
 */
async function handleMission(mission) {
  const { data: missionData, test, testid } = mission;
  let successCount = 0;
  let failureCount = 0;

  for (const deviceId of missionData.IDList) {
    // 在处理每个设备之前检查是否有新任务中断
    if (missionQueue.length > 0) {
      console.log('检测到新任务，中断当前任务...');
      throw new Error('被新任务取消');
    }

    try {
      await handleDeviceCommand(deviceId, missionData, test, testid);
      successCount++;
      console.log(`设备 ${deviceId} 的命令已成功完成。`);
    } catch (error) {
      console.error(`处理设备 ${deviceId} 的命令时出错:`, error.message);
      failureCount++;
    }
  }

  console.log(`任务已完成。成功: ${successCount}, 失败: ${failureCount}`);
  return { successCount, failureCount };
}

// --- command handle

/**
 * 处理单个设备的命令逻辑。
 * @param {number} deviceId - 设备 ID。
 * @param {object} missionData - 任务数据。
 * @param {boolean} test - 测试模式标志。
 * @param {number} testid - 测试设备 ID。
 */
/**
 * 处理单个设备的命令逻辑。
 * @param {number} deviceId - 设备 ID。
 * @param {object} missionData - 任务数据。
 * @param {boolean} test - 测试模式标志。
 * @param {number} testid - 测试设备 ID。
 */
async function handleDeviceCommand(deviceId, missionData, test, testid) {
  const { FunctionCode, data, retryTimes = 3 } = missionData;
  const packetDeviceId = test ? testid : deviceId;

  console.log(`正在处理设备 ${deviceId} 的命令，功能码: ${FunctionCode}`);

  // 根据功能码在发送前更新数据库
  await updateDatabaseBeforeSend(deviceId, FunctionCode, data);

  // 使用 switch 语句处理不同的功能码
  switch (FunctionCode) {
    case 15: // 时间同步
      // 1. 获取时间同步数据
      const timeData = packet.timeSync.GTD(); 
      // 2. 构造数据包
      const timePacketBuffer = makePacket(packetDeviceId, FunctionCode, 'GP', timeData);
      await COMMlog(timePacketBuffer);
      // 3. 发送时间同步命令，不依赖传入的data
      await syncTime(timePacketBuffer, deviceId, retryTimes);
      break;

    default: // 其他功能码，需要等待响应
      const packetBuffer = makePacket(packetDeviceId, FunctionCode, 'GP', data);
      await COMMlog(packetBuffer);
      const responseBuffer = await sendCommand(packetBuffer, deviceId, retryTimes);
      await COMMlog(responseBuffer);
      const parsedResponse = parsePacket(responseBuffer, 'PRP');
      // 根据响应的功能码更新数据库
      await updateDatabaseAfterReceive(deviceId, parsedResponse);
      break;
  }
}

// --- database update

/**
 * 在发送命令前更新数据库。
 * @param {number} deviceId - 设备 ID。
 * @param {number} functionCode - 命令功能码。
 * @param {object} data - 命令数据。
 */
async function updateDatabaseBeforeSend(deviceId, functionCode, data) {
  const dbData = { id: deviceId, ...data };
  switch (functionCode) {
    case 11: // basicSetting
      await update.basicSetting(dbData);
      break;
    case 13: // windowSetting
      await update.windowSetting(dbData);
      break;
    case 14: // schedule
      await update.schedule(dbData);
      break;
  }
}

/**
 * 接收响应后更新数据库。
 * @param {number} deviceId - 设备 ID。
 * @param {object} parsedResponse - 解析后的响应数据。
 */
async function updateDatabaseAfterReceive(deviceId, parsedResponse) {
  const { functionCode, ...responseFields } = parsedResponse;

  switch (functionCode) {
    case '87': // status
      await update.status({
        id: deviceId,
        statusCode: responseFields.statusCode,
        reasonCode: responseFields.reasonCode,
        voltage: responseFields.voltage,
        current: responseFields.current,
        power: responseFields.power
      });
      break;
    case '82': // readKWHR
      await update.readKWHR({
        id: deviceId,
        rechargeKWH: responseFields.rechargeKWH,
        initialKWH: responseFields.initialKWH,
        usedKWH: responseFields.usedKWH,
        totalKWH: responseFields.totalKWH
      });
      break;
  }
}

// 导出启动函数
export { startSerialService };