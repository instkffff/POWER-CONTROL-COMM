import { makePacket, parsePacket } from '../packetMaker/main.js';
import { update } from '../Database/main.js';
import { sendCommand } from './communicate/command.js';
import { syncTime } from './communicate/syncTime.js';
import { packet } from '../packet/main.js';
import { COMMlog } from '../Log/main.js';

// --- command handle
/**
 * 处理单个设备的命令逻辑。
 * @param {number} requestID - 请求ID
 * @param {number} progress - 进度
 * @param {number} deviceId - 设备 ID。
 * @param {object} missionData - 任务数据。
 * @param {boolean} test - 测试模式标志。
 * @param {number} testid - 测试设备 ID。
 */
async function handleDeviceCommand(requestID, progress, deviceId, missionData, test, testid) {
  const { FunctionCode, data } = missionData;
  const packetDeviceId = test ? testid : deviceId;
  const retryTimes = 2;

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
      // 根据command.js更新sendCommand调用方式
      const responseBuffer = await sendCommand(requestID, progress, packetBuffer, deviceId, retryTimes);
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
      update.basicSetting(dbData);
      break;
    case 13: // windowSetting
      update.windowSetting(dbData);
      break;
    case 14: // schedule
      update.schedule(dbData);
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
      update.status({
        id: deviceId,
        statusCode: responseFields.statusCode,
        reasonCode: responseFields.reasonCode,
        voltage: responseFields.voltage,
        current: responseFields.current,
        power: responseFields.power
      });
      break;
    case '82': // readKWHR
      update.readKWHR({
        id: deviceId,
        rechargeKWH: responseFields.rechargeKWH,
        initialKWH: responseFields.initialKWH,
        usedKWH: responseFields.usedKWH,
        totalKWH: responseFields.totalKWH
      });
      break;
  }
}

export { handleDeviceCommand }