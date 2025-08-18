import { openSerialPort, closeSerialPort, sendPacket, onPacketReceived, autoReconnect } from './SerialPort.js'
import { makePacket, parsePacket } from '../packetMaker/main.js'
import { query, update } from '../Database/main.js'
import { sendCommand, setResponseTimeout } from './communicate/command.js'
import { syncTime, setSyncTimeout } from './communicate/syncTime.js'
import { on, emit, EVENT_TYPES } from '../Websocket/eventList.js'
import { packet } from '../packet/main.js'
import { COMMlog } from '../Log/main.js'

// 将监听逻辑封装为函数
// 添加 test 和 testid 参数
const startSerialService = (test = true, testid = 801310) => {
  // 监听 missionList 事件
  on(EVENT_TYPES.MISSION_LIST, async (missionData) => {
    try {
      console.log('Received missionList event, processing...' + missionData);
      
      // 打开串口 - 使用固定的配置: COM5 9600 8 1 none
      const serialPort = await openSerialPort('COM5', {
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });
      
      // 记录成功和失败的设备数量
      let successCount = 0;
      let failureCount = 0;
      
      // 遍历所有设备ID，每个ID发送一次命令
      for (const deviceId of missionData.IDList) {
        const { FunctionCode, data, retryTimes = 3 } = missionData;
        
        console.log(`Processing command for device ${deviceId}, functionCode: ${FunctionCode}`);
        
        try {
          // 处理需要先更新数据库的命令
          if ([11, 13, 14].includes(FunctionCode)) {
            // 为数据库更新准备数据，添加deviceId
            const dbData = { id: deviceId, ...data };
            
            switch (FunctionCode) {
              case 11: // basicSetting
                update.basicSetting(dbData);
                break;
              case 14: // schedule
                update.schedule(dbData);
                break;
              case 13: // windowSetting
                update.windowSetting(dbData);
                break;
            }
          }
          
          // 处理 function code 为 15 的情况，使用 syncTime 发送命令
          if (FunctionCode === 15) {
            // 构造数据包
            const timeData = packet.timeSync.GTD();
            // 根据测试模式决定使用的设备ID
            const packetDeviceId = test ? testid : deviceId;
            const packetBuffer = makePacket(packetDeviceId, FunctionCode, 'GP', timeData);
            
            // 记录发送的buffer
            await COMMlog(packetBuffer);
            
            // 使用 syncTime 发送，不需要等待响应
            await syncTime(packetBuffer, deviceId, retryTimes);
          } else {
            // 其他功能码使用 sendCommand 发送并等待响应
            // 根据测试模式决定使用的设备ID
            const packetDeviceId = test ? testid : deviceId;
            const packetBuffer = makePacket(packetDeviceId, FunctionCode, 'GP', data);
            
            // 记录发送的buffer
            await COMMlog(packetBuffer);
            
            const responseBuffer = await sendCommand(packetBuffer, deviceId, retryTimes);
            
            // 记录返回的buffer
            await COMMlog(responseBuffer);
            
            // 解析响应
            const parsedResponse = parsePacket(responseBuffer, 'PRP');

            // 根据功能码更新数据库 (修复字符串与数字比较问题)
            if (['82', '87'].includes(parsedResponse.functionCode)) {
              switch (parsedResponse.functionCode) {
                case '87': // status
                  // 使用实际的设备ID并只保留模板中定义的字段
                  const statusData = {
                    id: deviceId,
                    statusCode: parsedResponse.statusCode,
                    reasonCode: parsedResponse.reasonCode,
                    voltage: parsedResponse.voltage,
                    current: parsedResponse.current,
                    power: parsedResponse.power
                  };

                  update.status(statusData);
                  break;
                case '82': // readKWHR
                  // 使用实际的设备ID并只保留模板中定义的字段
                  const kwhData = {
                    id: deviceId,
                    rechargeKWH: parsedResponse.rechargeKWH,
                    initialKWH: parsedResponse.initialKWH,
                    usedKWH: parsedResponse.usedKWH,
                    totalKWH: parsedResponse.totalKWH
                  };

                  update.readKWHR(kwhData);
                  break;
              }
            }
          }
          
          successCount++;
          console.log(`Command for device ${deviceId} completed successfully`);
        } catch (deviceError) {
          failureCount++;
          console.error(`Error processing command for device ${deviceId}:`, deviceError.message);
          // 继续处理下一个设备，不中断整个流程
          continue;
        }
      }
      
      // 关闭串口
      await closeSerialPort();
      
      // 发送任务完成事件
      console.log(`Mission completed. Success: ${successCount}, Failures: ${failureCount}`);
      emit(EVENT_TYPES.MISSION_SUCCESS, { 
        result: 'success',
        successCount,
        failureCount
      });
      
    } catch (error) {
      // 尝试关闭串口
      try {
        await closeSerialPort();
      } catch (closeError) {
        console.error('Error closing serial port:', closeError);
      }
      
      console.error('Error processing mission list:', error);
      emit(EVENT_TYPES.MISSION_FAILED, { result: 'failed', error: error.message });
    }
  });
  
  console.log('Serial communication service started. Waiting for missionList events...');
};

// 导出启动函数
export { startSerialService };