/* import { generatePacket, generateResponsePacket, parsePacket, parseResponsePacket } from "./base.js"
import { generateBasicSettingPacket, parseBasicSettingPacket, generateBasicSettingResponse, parseBasicSettingResponse } from "./basicSetting.js"
import { generateChargingPacket, parseChargingPacket, generateChargingResponse, parseChargingResponse } from "./charging.js"
import { HONgenerateCommandPacket, HONgenerateResponsePacket, HONparseCommandPacket, HONparseResponsePacket } from "./HaltOpenNormal.js"
import { generateReadKWHPacket, parseReadKWHPacket, generateReadKWHResponse, parseReadKWHResponse } from "./readKWH.js"
import { generateReadStatusPacket, parseReadStatusPacket, generateReadStatusResponse, parseReadStatusResponse } from "./readStatus.js"
import { generateSchedulePacket, parseSchedulePacket, generateScheduleResponse, parseScheduleResponse } from "./schedule.js"
import { generateTimeSyncPacket, parseTimeSyncPacket, getCurrentTimeData } from "./timeSync.js"
import { generateUnlockPacket, parseUnlockPacket, generateUnlockResponse, parseUnlockResponse } from "./unlock.js"
import { generateWindowSettingPacket, parseWindowSettingPacket, generateWindowSettingResponse, parseWindowSettingResponse } from "./windowSetting.js" */

/* 
1. 把函数对象化一下 再导出 

例如 使用 generatePacket 就是 base.generatePacket

2. 把函数名统一 generatePacket 不管是 
generateSchedulePacket 还是 generateReadStatusPacket 都转换成GP 
同理 generateResponsePacket 转换GRP 
parsePacket 转换PP
parseResponsePacket 转换PRP

3. 一条二条结合起来考虑
*/

// main.js
import * as base from "./base.js"
import * as basicSetting from "./basicSetting.js"
import * as charging from "./charging.js"
import * as haltOpenNormal from "./HaltOpenNormal.js"
import * as readKWH from "./readKWH.js"
import * as readStatus from "./readStatus.js"
import * as schedule from "./schedule.js"
import * as timeSync from "./timeSync.js"
import * as unlock from "./unlock.js"
import * as windowSetting from "./windowSetting.js"

// 统一导出对象，按模块分类并统一命名
export const packet = {
  // base 模块
  base: {
    GP: base.generatePacket,
    GRP: base.generateResponsePacket,
    PP: base.parsePacket,
    PRP: base.parseResponsePacket
  },
  
  // basicSetting 模块
  basicSetting: {
    GP: basicSetting.generateBasicSettingPacket,
    GRP: basicSetting.generateBasicSettingResponse,
    PP: basicSetting.parseBasicSettingPacket,
    PRP: basicSetting.parseBasicSettingResponse
  },
  
  // charging 模块
  charging: {
    GP: charging.generateChargingPacket,
    GRP: charging.generateChargingResponse,
    PP: charging.parseChargingPacket,
    PRP: charging.parseChargingResponse
  },
  
  // haltOpenNormal 模块 (HON前缀保持不变)
  haltOpenNormal: {
    GP: haltOpenNormal.HONgenerateCommandPacket,
    GRP: haltOpenNormal.HONgenerateResponsePacket,
    PP: haltOpenNormal.HONparseCommandPacket,
    PRP: haltOpenNormal.HONparseResponsePacket
  },
  
  // readKWH 模块
  readKWH: {
    GP: readKWH.generateReadKWHPacket,
    GRP: readKWH.generateReadKWHResponse,
    PP: readKWH.parseReadKWHPacket,
    PRP: readKWH.parseReadKWHResponse
  },
  
  // readStatus 模块
  readStatus: {
    GP: readStatus.generateReadStatusPacket,
    GRP: readStatus.generateReadStatusResponse,
    PP: readStatus.parseReadStatusPacket,
    PRP: readStatus.parseReadStatusResponse
  },
  
  // schedule 模块
  schedule: {
    GP: schedule.generateSchedulePacket,
    GRP: schedule.generateScheduleResponse,
    PP: schedule.parseSchedulePacket,
    PRP: schedule.parseScheduleResponse
  },
  
  // timeSync 模块
  timeSync: {
    GP: timeSync.generateTimeSyncPacket,
    PP: timeSync.parseTimeSyncPacket,
    GTD: timeSync.getCurrentTimeData
  },
  
  // unlock 模块
  unlock: {
    GP: unlock.generateUnlockPacket,
    GRP: unlock.generateUnlockResponse,
    PP: unlock.parseUnlockPacket,
    PRP: unlock.parseUnlockResponse
  },
  
  // windowSetting 模块
  windowSetting: {
    GP: windowSetting.generateWindowSettingPacket,
    GRP: windowSetting.generateWindowSettingResponse,
    PP: windowSetting.parseWindowSettingPacket,
    PRP: windowSetting.parseWindowSettingResponse
  }
}

/* // 示例用法
const scheduleCommand = packet.schedule.GP( 14, {
    period: 1,
    mode: 1,  // 开关机模式
    power: 0.0,
    weekSchedule: [
        { haltHour: 0, haltMinute: 0, openHour: 7, openMinute: 30 }, // 周一
        { haltHour: 0, haltMinute: 0, openHour: 6, openMinute: 30 }, // 周二
        { haltHour: 0, haltMinute: 0, openHour: 5, openMinute: 30 }, // 周三
        { haltHour: 0, haltMinute: 0, openHour: 4, openMinute: 30 }, // 周四
        { haltHour: 0, haltMinute: 0, openHour: 3, openMinute: 30 }, // 周五
        { haltHour: 0, haltMinute: 0, openHour: 2, openMinute: 30 }, // 周六
        { haltHour: 0, haltMinute: 0, openHour: 1, openMinute: 30 }  // 周日
    ]
})

console.log(scheduleCommand) */