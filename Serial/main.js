import { openSerialPort, closeSerialPort, sendPacket, onPacketReceived, autoReconnect } from './SerialPort.js'
import { makePacket, parsePacket } from '../packetMaker/main.js'
import { query, update } from '../Database/main.js'
import { sendCommand, setResponseTimeout } from './communicate/command.js'
import { syncTime, setSyncTimeout } from './communicate/syncTime.js'
import { on, emit, EVENT_TYPES } from '../Websocket/eventList.js'

/* 
操作流程 

命令的格式 和 update 的格式 可能有差异 只提取关键词构建 update 示例格式传给 update 即可

1. 监听 missionList emit 事件
2. 接到 missionList 后 读取 missionList.json 并打开串口
3. 遍历 missionList.json 解析为单条命令
4. 单条命令的 functionCode 
为 
11 basicSetting
14 schedule
13 windowSetting

则调用 update

update.basicSetting({ 
  id: 801000, 
  totalPower: 1000, 
  reactivePower: 400, 
  activePower: 990, 
  inductorPower: 990, 
  delay1: 60, 
  delay2: 60, 
  delay3: 60, 
  retry: 4 
});

update.schedule({
  id: 801000,
  period: 1,
  mode: 1,
  power: 0,
  weekSchedule: [
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30}
  ]
});

update.windowSetting({
  id: 801000,
  powerA: 0,
  powerB: 0,
  factorA: 100,
  factorB: 100
});

5. 将命令通过 makePacket 制作为 Buffer 传给 sendCommand

6. 等待 sendCommand 的返回结果

7. 使用 parsePacket 解析返回结果

8. 根据 parsePacket 的结果
如果functionCode
为

87 status

update.status({ 
  id: 801000, 
  statusCode: 1, 
  reasonCode: 0, 
  voltage: 220.5, 
  current: 1.2, 
  power: 200.0 
});

82 readKWHR

update.readKWHR({
  id: 801000,
  rechargeKWH: 0,
  initialKWH: 100,
  usedKWH: 10,
  totalKWH: 90
});

9. functionList.json 所有 deviceID 遍历并发送完后
emit 'missionSuccess'

*/

// 将监听逻辑封装为函数
const startSerialService = () => {
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
          
          // 构造数据包 (根据test.js中的用法修正)
          const packetBuffer = makePacket(801310, FunctionCode, 'GP', data);
          
          // 发送命令并等待响应
          const responseBuffer = await sendCommand(packetBuffer, deviceId, retryTimes);
          
          // 解析响应 (根据test.js中的用法修正)
          const parsedResponse = parsePacket(responseBuffer, 'PRP');
          
          // 根据功能码更新数据库
          if ([82, 87].includes(parsedResponse.functionCode)) {
            switch (parsedResponse.functionCode) {
              case 87: // status
                // 添加deviceId到数据中
                const statusData = { id: 801003, ...parsedResponse.data };
                update.status(statusData);
                break;
              case 82: // readKWHR
                // 添加deviceId到数据中
                const kwhData = { id: 801003, ...parsedResponse.data };
                update.readKWHR(kwhData);
                break;
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