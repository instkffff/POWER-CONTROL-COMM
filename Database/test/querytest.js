import { query, update } from '../main.js';

// 查询操作
const statusData = query.status({ levelList: [1, 2] });
const basicSettingData = query.basicSetting({ deviceIDList: [801000, 801001] });
const scheduleData = query.schedule({ groupList: [1, 2] });
const windowSettingData = query.windowSetting({ roomIDList: [1001, 1002] });
const readKWHRData = query.readKWHR({ levelList: [1, 3], groupList: [1, 2] });