// schedule.js
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 更新单条 schedule 数据
 * @param {Object} data - 从设备读取的数据
 * {
 *   "id": 801310,
 *   "functionCode": "14",
 *   "length": 35,
 *   "period": 1,
 *   "mode": 1,
 *   "power": 0,
 *   "weekSchedule": [
 *     {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
 *     {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
 *     {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
 *     {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
 *     {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
 *     {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
 *     {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30}
 *   ],
 *   "isValid": true
 * }
 */
function updateScheduleData(data) {
  try {
    // 创建数据库连接
    const dbPath = join(__dirname, '..', 'test', 'power-control.db');
    const db = new Database(dbPath);
    
    // 准备更新语句
    const updateStmt = db.prepare(`
      UPDATE "schedule" 
      SET period = ?, mode = ?, power = ?, weekSchedule = ?
      WHERE deviceID = ?
    `);
    
    // 将 weekSchedule 对象转换为 JSON 字符串
    const weekScheduleJson = JSON.stringify(data.weekSchedule);
    
    // 执行更新
    const result = updateStmt.run(
      data.period,
      data.mode,
      data.power,
      weekScheduleJson,
      data.id
    );
    
    // 检查是否有记录被更新
    if (result.changes === 0) {
      console.log(`未找到设备 ID ${data.id} 的记录`);
    } else {
      console.log(`成功更新设备 ${data.id} 的调度数据`);
    }
    
    // 关闭数据库连接
    db.close();
    
    return result;
  } catch (error) {
    console.error('更新 schedule 数据失败:', error.message);
    throw error;
  }
}

export { updateScheduleData };

/* // 更新单条数据
const data = {
  "id": 801001,
  "functionCode": "14",
  "length": 35,
  "period": 1,
  "mode": 1,
  "power": 0,
  "weekSchedule": [
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30},
    {"haltHour":0,"haltMinute":0,"openHour":7,"openMinute":30}
  ],
  "isValid": true
};

updateScheduleData(data); */