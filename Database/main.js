// main.js
// query
import { queryBasicSettingData } from './query/QbasicSetting.js'
import { queryScheduleData } from './query/Qschedule.js'
import { queryWindowSettingData } from './query/QwindowSetting.js'
import { queryReadKWHRData } from './query/QreadKWHR.js'
import { queryStatusData } from './query/Qstatus.js'

// insert
import { updateBasicSettingData } from './insert/basicSetting.js'
import { updateScheduleData } from './insert/schedule.js'
import { updateWindowSettingData } from './insert/windowSetting.js'
import { updateReadKWHRData } from './insert/readKWHR.js'
import { updateStatusData } from './insert/status.js'

// 查询模块
const query = {
  basicSetting: queryBasicSettingData,
  schedule: queryScheduleData,
  windowSetting: queryWindowSettingData,
  readKWHR: queryReadKWHRData,
  status: queryStatusData
};

// 更新模块
const update = {
  basicSetting: updateBasicSettingData,
  schedule: updateScheduleData,
  windowSetting: updateWindowSettingData,
  readKWHR: updateReadKWHRData,
  status: updateStatusData
};

export { query, update };


/* // 查询操作
const statusData = query.status({ levelList: [1, 2] });
const basicSettingData = query.basicSetting({ deviceIDList: [801000, 801001] });
const scheduleData = query.schedule({ groupList: [1, 2] });
const windowSettingData = query.windowSetting({ roomIDList: [1001, 1002] });
const readKWHRData = query.readKWHR({ levelList: [1, 3], groupList: [1, 2] });

// 更新操作
update.status({ 
  id: 801000, 
  statusCode: 1, 
  reasonCode: 0, 
  voltage: 220.5, 
  current: 1.2, 
  power: 200.0 
});

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

update.readKWHR({
  id: 801000,
  rechargeKWH: 0,
  initialKWH: 100,
  usedKWH: 10,
  totalKWH: 90
}); */